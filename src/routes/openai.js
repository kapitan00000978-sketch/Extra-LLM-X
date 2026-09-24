import express from 'express';
import { routerEngine } from '../engine/router.js';
import { getAllCombos } from '../engine/combos.js';
import { responseCache } from '../engine/cache.js';
import { freeEmbeddings } from '../engine/embeddings.js';
import { imagesRouter } from './images.js';
import { ModelStore, KeyStore, LogStore } from '../db/database.js';
import { config } from '../config.js';

export const openaiRouter = express.Router();

// Mount Free Image Generation
openaiRouter.use('/images', imagesRouter);

function authMiddleware(req, res, next) {
  if (!config.enableAuth) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
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

  // Extra Multimodal entries (Embeddings & Flux Image Gen)
  const multimodalEntries = [
    {
      id: 'extra/free-embedding',
      object: 'model',
      created: now,
      owned_by: 'extra-llm-x',
      permission: [],
      root: 'extra/free-embedding',
      extra_llm_x: { type: 'embedding', capabilities: 'embedding', is_free: true }
    },
    {
      id: 'image/flux',
      object: 'model',
      created: now,
      owned_by: 'pollinations',
      permission: [],
      root: 'flux',
      extra_llm_x: { type: 'image_generation', capabilities: 'image', is_free: true }
    }
  ];

  res.json({
    object: 'list',
    data: [...comboEntries, ...modelEntries, ...multimodalEntries]
  });
});

/**
 * POST /v1/chat/completions
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

  const skipCache = responseCache.shouldSkip(req);

  try {
    const result = await routerEngine.dispatch({
      clientKey: req.clientKey,
      requestedModel: model,
      messages,
      stream,
      temperature,
      max_tokens,
      tools,
      tool_choice,
      skipCache
    });

    const latencyMs = Date.now() - result.startTime;

    // Cache Hit Execution Path (0ms repeat latency, token savings)
    if (result.isCached) {
      const saved = (result.promptTokens || 0) + (result.completionTokens || 0);
      res.setHeader('X-ExtraLLMX-Cache', 'HIT');
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Tokens-Saved', saved.toString());
      res.setHeader('X-ExtraLLMX-Provider', 'cache');
      res.setHeader('X-ExtraLLMX-Actual-Model', result.model);
      res.setHeader('X-ExtraLLMX-Fallback', 'false');
      res.setHeader('X-ExtraLLMX-Latency-Ms', latencyMs.toString());
      res.setHeader('x-omniroute-provider', 'cache');
      res.setHeader('x-omniroute-actual-model', result.model);
      res.setHeader('x-omniroute-fallback', 'false');
      res.setHeader('x-omniroute-latency-ms', latencyMs.toString());

      LogStore.record({
        clientKey: req.clientKey,
        requestedModel: model,
        actualModel: result.model,
        provider: 'cache',
        promptTokens: result.promptTokens || 0,
        completionTokens: result.completionTokens || 0,
        latencyMs,
        statusCode: 200,
        fallbackOccurred: false
      });

      return res.json(result.cachedData);
    }

    res.setHeader('X-ExtraLLMX-Cache', 'MISS');
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-ExtraLLMX-Provider', result.provider);
    res.setHeader('X-ExtraLLMX-Actual-Model', result.model);
    res.setHeader('X-ExtraLLMX-Fallback', result.fallbackOccurred ? 'true' : 'false');
    res.setHeader('X-ExtraLLMX-Latency-Ms', latencyMs.toString());

    // OmniRoute Compatibility Headers
    res.setHeader('x-omniroute-provider', result.provider);
    res.setHeader('x-omniroute-actual-model', result.model);
    res.setHeader('x-omniroute-fallback', result.fallbackOccurred ? 'true' : 'false');
    res.setHeader('x-omniroute-latency-ms', latencyMs.toString());
    if (result.compression) {
      res.setHeader('x-omniroute-compressed', result.compression.compressed ? 'true' : 'false');
      res.setHeader('x-omniroute-tokens-saved', (result.compression.tokensSaved || 0).toString());
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let promptTokens = messages.reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length / 4 : 0), 0);
      let completionTokens = 0;

      const upstreamBody = result.response.body;
      if (upstreamBody) {
        const reader = upstreamBody.getReader();
        const decoder = new TextDecoder();
        let clientClosed = false;

        req.on('close', () => {
          clientClosed = true;
          reader.cancel().catch(() => {});
        });

        try {
          while (!clientClosed) {
            const { done, value } = await reader.read();
            if (done || clientClosed) break;
            const textChunk = decoder.decode(value, { stream: true });
            completionTokens += Math.max(1, Math.round(textChunk.length / 4));
            res.write(textChunk);
          }
        } catch (streamErr) {
          if (!clientClosed) {
            console.warn(`[OpenAI Route] Stream error: ${streamErr.message}`);
          }
        } finally {
          res.end();
        }
      } else {
        res.end();
      }

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
      const data = await result.response.json();
      const promptTokens = data.usage?.prompt_tokens || 0;
      const completionTokens = data.usage?.completion_tokens || 0;

      // Save to L1/L2 Response Cache
      if (result.cacheHash) {
        responseCache.set(result.cacheHash, result.model, data, promptTokens, completionTokens);
      }

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
        suggestion: 'Ensure you have added at least one free API key at http://localhost:3000'
      }
    });
  }
});

/**
 * POST /v1/embeddings
 * Universal 100% Free Vector Embeddings Engine (Ollama / HuggingFace / Deterministic)
 */
openaiRouter.post('/embeddings', authMiddleware, async (req, res) => {
  try {
    const { input, model } = req.body;
    const result = await freeEmbeddings.getEmbeddings({ input, model });
    res.json({
      object: 'list',
      data: result.data,
      model: result.model,
      usage: result.usage
    });
  } catch (err) {
    console.error(`[Embeddings Route Error] ${err.message}`);
    res.status(500).json({
      error: {
        message: err.message,
        type: 'api_error',
        code: 500
      }
    });
  }
});

