import express from 'express';
import { routerEngine } from '../engine/router.js';
import { getAllCombos } from '../engine/combos.js';
import { responseCache } from '../engine/cache.js';
import { freeEmbeddings } from '../engine/embeddings.js';
import { FreeSearchEngine } from '../engine/search.js';
import { CodeSandboxEngine } from '../engine/sandbox.js';
import { ToolCallingPolyfill } from '../engine/tool_calling.js';
import { ContextCompactor } from '../engine/compactor.js';
import { imagesRouter } from './images.js';
import { audioRouter } from './audio.js';
import { moderationsRouter } from './moderations.js';
import { batchRouter } from './batches.js';
import { ModelStore, KeyStore, LogStore } from '../db/database.js';
import { config } from '../config.js';

export const openaiRouter = express.Router();

// Mount Free Image Generation
openaiRouter.use('/images', imagesRouter);

// Mount Free Audio Transcriptions (Whisper)
openaiRouter.use('/audio', audioRouter);

// Mount Free Content Moderations
openaiRouter.use('/moderations', moderationsRouter);

// Mount OpenAI Batch API
openaiRouter.use(batchRouter);

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
 * Returns all free models aggregated from all configured free providers and virtual combos
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

  // Extra Multimodal & Studio entries
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
    },
    {
      id: 'audio/whisper-large-v3',
      object: 'model',
      created: now,
      owned_by: 'groq',
      permission: [],
      root: 'whisper-large-v3',
      extra_llm_x: { type: 'audio_transcription', capabilities: 'audio', is_free: true }
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
    tool_choice,
    web_search = false,
    compact_context = false
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

  let processedMessages = messages;
  let searchResults = [];

  // 1. Live Web Search Grounding
  if (web_search === true) {
    try {
      const groundResult = await FreeSearchEngine.groundMessages(processedMessages);
      processedMessages = groundResult.messages;
      searchResults = groundResult.searchResults;
      if (searchResults.length > 0) {
        res.setHeader('X-ExtraLLMX-WebSearch-Grounded', 'true');
        res.setHeader('X-ExtraLLMX-Sources-Count', searchResults.length.toString());
      }
    } catch (e) {
      console.warn('[Web Search Grounding Warning]:', e.message);
    }
  }

  // 2. Intelligent Context Compaction
  if (compact_context === true) {
    try {
      const compactResult = ContextCompactor.compact(processedMessages);
      if (compactResult.compacted) {
        processedMessages = compactResult.messages;
        res.setHeader('X-ExtraLLMX-Context-Compacted', 'true');
        res.setHeader('X-ExtraLLMX-Tokens-Saved', (compactResult.tokensSaved || 0).toString());
      }
    } catch (e) {
      console.warn('[Context Compactor Warning]:', e.message);
    }
  }

  // 3. Universal Tool Calling Polyfill
  const hasTools = Array.isArray(tools) && tools.length > 0;
  if (hasTools) {
    processedMessages = ToolCallingPolyfill.injectToolsPrompt(processedMessages, tools);
  }

  const skipCache = responseCache.shouldSkip(req);

  try {
    const result = await routerEngine.dispatch({
      clientKey: req.clientKey,
      requestedModel: model,
      messages: processedMessages,
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

      let promptTokens = processedMessages.reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length / 4 : 0), 0);
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
            console.warn('[OpenAI Route] Stream error: ' + streamErr.message);
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

      // Polyfill Tool Call extraction from content if tools were requested
      if (hasTools && data.choices && data.choices[0]?.message?.content) {
        const { cleanContent, toolCalls } = ToolCallingPolyfill.extractToolCalls(data.choices[0].message.content);
        if (toolCalls && toolCalls.length > 0) {
          data.choices[0].message.tool_calls = toolCalls;
          data.choices[0].message.content = cleanContent || null;
          data.choices[0].finish_reason = 'tool_calls';
        }
      }

      // Attach search grounding citations if available
      if (searchResults && searchResults.length > 0) {
        data.extra_llm_x_search_results = searchResults;
      }

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

/**
 * POST /v1/search
 * 100% Free Live Web Search Grounding API
 */
openaiRouter.post('/search', authMiddleware, async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        error: {
          message: 'Invalid request: "query" string parameter is required.',
          type: 'invalid_request_error',
          code: 400
        }
      });
    }

    const maxResults = Math.min(20, Math.max(1, parseInt(limit, 10) || 5));
    const results = await FreeSearchEngine.search(query.trim(), maxResults);

    res.json({
      object: 'list',
      query: query.trim(),
      count: results.length,
      data: results
    });
  } catch (err) {
    console.error(`[Search Route Error] ${err.message}`);
    res.status(500).json({
      error: {
        message: err.message,
        type: 'api_error',
        code: 500
      }
    });
  }
});

/**
 * POST /v1/sandbox/eval
 * 100% Free Isolated Code Execution Sandbox API (Python & JavaScript)
 */
openaiRouter.post('/sandbox/eval', authMiddleware, async (req, res) => {
  try {
    const { language = 'javascript', code, timeoutMs = 5000 } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: {
          message: 'Invalid request: "code" string is required.',
          type: 'invalid_request_error',
          code: 400
        }
      });
    }

    const result = await CodeSandboxEngine.execute({
      language,
      code,
      timeoutMs: Math.min(30000, Math.max(500, parseInt(timeoutMs, 10) || 5000))
    });

    res.json(result);
  } catch (err) {
    console.error(`[Sandbox Route Error] ${err.message}`);
    res.status(500).json({
      error: {
        message: err.message,
        type: 'api_error',
        code: 500
      }
    });
  }
});

/**
 * POST /v1/compactor/compact
 * Extends context windows for free models by compacting conversation history
 */
openaiRouter.post('/compactor/compact', authMiddleware, async (req, res) => {
  try {
    const { messages = [], maxTokens = 3000, keepRecent = 4 } = req.body;
    const result = ContextCompactor.compact(messages, { maxTokens, keepRecent });
    res.json(result);
  } catch (err) {
    console.error(`[Compactor Route Error] ${err.message}`);
    res.status(500).json({
      error: {
        message: err.message,
        type: 'api_error',
        code: 500
      }
    });
  }
});
