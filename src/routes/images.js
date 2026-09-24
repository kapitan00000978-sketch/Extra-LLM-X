import express from 'express';
import { KeyStore, LogStore } from '../db/database.js';
import { config } from '../config.js';

export const imagesRouter = express.Router();

function authMiddleware(req, res, next) {
  if (!config.enableAuth) return next();
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      error: { message: 'Missing Authorization header.', type: 'invalid_request_error', code: 401 }
    });
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const validKey = KeyStore.verifySystemKey(token);
  if (!validKey) {
    return res.status(401).json({
      error: { message: 'Invalid Extra LLM X API Key.', type: 'invalid_request_error', code: 401 }
    });
  }
  req.clientKey = token;
  next();
}

/**
 * POST /v1/images/generations
 * 100% Free OpenAI-compatible image generation via Pollinations AI (Flux / Turbo)
 */
imagesRouter.post('/generations', authMiddleware, async (req, res) => {
  const startTime = Date.now();
  const {
    prompt,
    model = 'flux',
    n = 1,
    size = '1024x1024',
    response_format = 'url'
  } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      error: {
        message: 'Invalid request: "prompt" string is required.',
        type: 'invalid_request_error',
        code: 400
      }
    });
  }

  // Parse size
  let width = 1024;
  let height = 1024;
  if (size && size.includes('x')) {
    const parts = size.split('x').map(p => parseInt(p, 10));
    if (parts[0] && parts[1]) {
      width = Math.min(1920, Math.max(256, parts[0]));
      height = Math.min(1920, Math.max(256, parts[1]));
    }
  }

  // Model selection
  let selectedModel = 'flux';
  if (model.includes('turbo')) selectedModel = 'turbo';
  else if (model.includes('flux')) selectedModel = 'flux';

  const count = Math.min(4, Math.max(1, parseInt(n, 10) || 1));
  const results = [];

  try {
    for (let i = 0; i < count; i++) {
      const seed = Math.floor(Math.random() * 10000000);
      const encodedPrompt = encodeURIComponent(prompt.trim());
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${selectedModel}&nologo=true&seed=${seed}`;

      if (response_format === 'b64_json') {
        try {
          const imgFetch = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
          if (imgFetch.ok) {
            const arrayBuf = await imgFetch.arrayBuffer();
            const b64 = Buffer.from(arrayBuf).toString('base64');
            results.push({ b64_json: b64, revised_prompt: prompt });
          } else {
            results.push({ url: imageUrl, revised_prompt: prompt });
          }
        } catch (e) {
          // If fetch fails, return the direct URL fallback
          results.push({ url: imageUrl, revised_prompt: prompt });
        }
      } else {
        results.push({ url: imageUrl, revised_prompt: prompt });
      }
    }

    const latencyMs = Date.now() - startTime;
    LogStore.record({
      clientKey: req.clientKey,
      requestedModel: `image/${selectedModel}`,
      actualModel: selectedModel,
      provider: 'pollinations',
      promptTokens: Math.round(prompt.length / 4),
      completionTokens: count * 1000,
      latencyMs,
      statusCode: 200,
      fallbackOccurred: false
    });

    res.json({
      created: Math.floor(Date.now() / 1000),
      data: results
    });
  } catch (err) {
    console.error(`[Images Route Error] ${err.message}`);
    res.status(500).json({
      error: {
        message: err.message,
        type: 'api_error',
        code: 500
      }
    });
  }
});
