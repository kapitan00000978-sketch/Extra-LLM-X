import express from 'express';
import crypto from 'crypto';
import { KeyStore } from '../db/database.js';
import { config } from '../config.js';

export const moderationsRouter = express.Router();

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
 * POST /v1/moderations
 * 100% Free OpenAI-compatible Content Safety & Moderation Endpoint
 */
moderationsRouter.post('/', authMiddleware, (req, res) => {
  const { input, model = 'text-moderation-latest' } = req.body;

  if (!input) {
    return res.status(400).json({
      error: { message: 'Invalid request: "input" is required.', type: 'invalid_request_error', code: 400 }
    });
  }

  const inputs = Array.isArray(input) ? input : [input];
  const modId = 'modr-' + crypto.randomBytes(12).toString('hex');

  const results = inputs.map(text => {
    const lower = typeof text === 'string' ? text.toLowerCase() : '';

    // Fast heuristic safety check
    const hatePattern = /\b(hate|slur|kill all)\b/i;
    const violencePattern = /\b(terrorist attack|build a bomb|murder instructions)\b/i;
    const selfHarmPattern = /\b(how to commit suicide|kill myself)\b/i;

    const isHate = hatePattern.test(lower);
    const isViolence = violencePattern.test(lower);
    const isSelfHarm = selfHarmPattern.test(lower);
    const flagged = isHate || isViolence || isSelfHarm;

    return {
      flagged,
      categories: {
        sexual: false,
        hate: isHate,
        harassment: isHate,
        'self-harm': isSelfHarm,
        'sexual/minors': false,
        'hate/threatening': isHate,
        'violence/graphic': isViolence,
        'self-harm/intent': isSelfHarm,
        'self-harm/instructions': isSelfHarm,
        'harassment/threatening': isHate,
        violence: isViolence
      },
      category_scores: {
        sexual: 0.0001,
        hate: isHate ? 0.95 : 0.0002,
        harassment: isHate ? 0.90 : 0.0002,
        'self-harm': isSelfHarm ? 0.98 : 0.0001,
        'sexual/minors': 0.00001,
        'hate/threatening': isHate ? 0.88 : 0.0001,
        'violence/graphic': isViolence ? 0.85 : 0.0002,
        'self-harm/intent': isSelfHarm ? 0.95 : 0.0001,
        'self-harm/instructions': isSelfHarm ? 0.96 : 0.0001,
        'harassment/threatening': isHate ? 0.85 : 0.0001,
        violence: isViolence ? 0.92 : 0.0003
      }
    };
  });

  res.json({
    id: modId,
    model,
    results
  });
});
