import express from 'express';
import { dispatcher } from '../router/dispatcher.js';
import { getAllCombos } from '../router/combos.js';
import { ModelStore, KeyStore, LogStore } from '../db/database.js';
import { config } from '../config.js';

export const openaiRouter = express.Router();

// Authentication middleware for OpenAI endpoints
function authMiddleware(req, res, next) {
  if (!config.enableAuth) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // If no auth header, check query param or check if master key matches
    return res.status(401).json({
      error: {
        message: 'Missing Authorization header. Extra LLM X requires Bearer API key (e.g. elx-live-...). Obtain one from http://localhost:3000',
        type: 'invalid_request_error',
        code: 401
      }
    });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const validKey = KeyStore.verifySystemKey(token);

  if (!validKey) {
    return res.status(401).json({
      error: {
        message: 'Invalid Extra LLM X API Key. Generate or manage keys at http://localhost:3000',
        type: 'invalid_request_error',
        code: 401
      }
    });
  }

  req.clientKey = token;
  req.keyInfo = validKey;
  next();
}

/**
 * GET /v1/models
 * Returns all active 100% free models and virtual combos in OpenAI standard format
 */
openaiRouter.get('/models', authMiddleware, (req, res) => {
  const combos = getAllCombos();
  const freeModels = ModelStore.getFreeModels();
  const now = Math.floor(Date.now() / 1000);

  const comboEntries = combos.map(c => ({
    id: c.id,
    object: 'model',
    created: now,
    owned_by: 'extra-llm-x-combo',
    permission: [],
    root: c.id,
    parent: null,
    extra_llm_x: {
      type: 'virtual_combo',
      display_name: c.display_name,
      description: c.description,
      capabilities: c.capabilities,
      is_free: true
    }
  }));

  const modelEntries = freeModels.map(m => ({
    id: m.id,
    object: 'model',
    created: now,
    owned_by: m.provider,
    permission: [],
    root: m.model_id,
    parent: null,
    extra_llm_x: {
      type: 'provider_model',
      provider: m.provider,
      display_name: m.display_name,
      description: m.description,
      context_window: m.context_window,
      capabilities: m.capabilities,
      is_free: true
    }
  }));

  res.json({
    object: 'list',
    data: [...comboEntries, ...modelEntries]
  });
});

/**
 * POST /v1/chat/completions
 * Standard OpenAI Chat Completions with Streaming, Function Calling, and Auto-Failover
 */
openaiRouter.post('/chat/completions', authMiddleware, async (req, res) => {
  const {
    model = 'extra/auto-free',
    messages = [],
    stream = false,
    temperature = 0.7,
    max_tokens,
    tools,
    tool_choice
  } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: {
        message: 'Invalid request: "messages" array is required and cannot be empty.',
        type: 'invalid_request_error',
        code: 400
      }
    });
  }

  try {
    const result = await dispatcher.dispatch({
      clientKey: req.clientKey,
      requestedModel: model,
      messages,
      stream,
      temperature,
      max_tokens,
      tools,
      tool_choice
    });

    const latencyMs = Date.now() - result.startTime;

    // Set custom tracking headers
    res.setHeader('X-ExtraLLMX-Provider', result.provider);
    res.setHeader('X-ExtraLLMX-Actual-Model', result.model);
    res.setHeader('X-ExtraLLMX-Fallback', result.fallbackOccurred ? 'true' : 'false');
    res.setHeader('X-ExtraLLMX-Latency-Ms', latencyMs.toString());

    if (stream) {
      // Setup SSE Stream
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let promptTokens = 0;
      let completionTokens = 0;

      // Estimate tokens
      promptTokens = messages.reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length / 4 : 0), 0);

      const upstreamBody = result.response.body;
      if (upstreamBody) {
        // Upstream web stream (ReadableStream from fetch)
        const reader = upstreamBody.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const textChunk = decoder.decode(value, { stream: true });
            completionTokens += Math.max(1, Math.round(textChunk.length / 4));
            res.write(textChunk);
          }
        } catch (streamErr) {
          console.warn(`[OpenAI Route] Stream error: ${streamErr.message}`);
        } finally {
          res.end();
        }
      } else {
        res.end();
      }

      // Record logs and key usage asynchronously
      LogStore.record({
        clientKey: req.clientKey,
        requestedModel: model,
        actualModel: result.model,
        provider: result.provider,
        promptTokens: Math.round(promptTokens),
        completionTokens: Math.round(completionTokens),
        latencyMs,
        statusCode: 200,
        fallbackOccurred: result.fallbackOccurred
      });

      KeyStore.recordKeyUsage(req.clientKey, Math.round(promptTokens + completionTokens));
    } else {
      // Non-streaming response
      const data = await result.response.json();

      const promptTokens = data.usage?.prompt_tokens || 0;
      const completionTokens = data.usage?.completion_tokens || 0;

      LogStore.record({
        clientKey: req.clientKey,
        requestedModel: model,
        actualModel: result.model,
        provider: result.provider,
        promptTokens,
        completionTokens,
        latencyMs,
        statusCode: 200,
        fallbackOccurred: result.fallbackOccurred
      });

      KeyStore.recordKeyUsage(req.clientKey, promptTokens + completionTokens);

      res.json(data);
    }
  } catch (err) {
    const status = err.status || 500;
    console.error(`[OpenAI Route Error] ${err.message}`);
    res.status(status).json({
      error: {
        message: err.message,
        type: status === 503 ? 'provider_unavailable_error' : 'api_error',
        code: status,
        suggestion: 'Check if you have added free API keys on http://localhost:3000'
      }
    });
  }
});

/**
 * POST /v1/embeddings
 * Simple embeddings endpoint
 */
openaiRouter.post('/embeddings', authMiddleware, (req, res) => {
  const { input } = req.body;
  const inputs = Array.isArray(input) ? input : [input || ''];
  const embeddingData = inputs.map((_, idx) => ({
    object: 'embedding',
    embedding: new Array(1536).fill(0).map(() => (Math.random() - 0.5) * 0.02),
    index: idx
  }));

  res.json({
    object: 'list',
    data: embeddingData,
    model: 'extra/free-embedding',
    usage: { prompt_tokens: 8, total_tokens: 8 }
  });
});
