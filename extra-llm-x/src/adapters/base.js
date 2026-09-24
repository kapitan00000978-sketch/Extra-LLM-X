export class BaseAdapter {
  constructor({ id, name, badge, getKeyUrl, guide, freeTierInfo, popularModels, keyPrefix = '', keyPlaceholder = '' }) {
    this.id = id;
    this.name = name;
    this.badge = badge;
    this.getKeyUrl = getKeyUrl;
    this.guide = guide;
    this.freeTierInfo = freeTierInfo;
    this.popularModels = popularModels;
    this.keyPrefix = keyPrefix;
    this.keyPlaceholder = keyPlaceholder;
  }

  // Returns array of { id, provider, model_id, display_name, description, context_window, is_free, capabilities }
  async discoverModels(apiKey) {
    throw new Error(`discoverModels not implemented for ${this.id}`);
  }

  // Executes chat completion
  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    throw new Error(`executeChat not implemented for ${this.id}`);
  }

  classifyError(err, status) {
    const msg = (err.message || '').toLowerCase();
    const isRateLimit = status === 429 || msg.includes('rate limit') || msg.includes('quota') || msg.includes('too many requests') || msg.includes('exhausted');
    const isAuth = status === 401 || status === 403 || msg.includes('unauthorized') || msg.includes('invalid api key');
    const isServer = status >= 500;
    return { isRateLimit, isAuth, isServer };
  }

  parseCooldownSeconds(headers, defaultSeconds = 60) {
    if (!headers) return defaultSeconds;

    const retryAfter = headers.get ? headers.get('retry-after') : headers['retry-after'];
    if (retryAfter) {
      const parsed = parseInt(retryAfter, 10);
      if (!isNaN(parsed) && parsed > 0) return Math.min(300, Math.max(5, parsed));
    }

    const resetHeader = headers.get ? headers.get('x-ratelimit-reset') : headers['x-ratelimit-reset'];
    if (resetHeader) {
      const resetTime = parseFloat(resetHeader);
      if (!isNaN(resetTime) && resetTime > 0) {
        // Could be epoch seconds or delta seconds
        const delta = resetTime > 1000000000 ? Math.ceil(resetTime - (Date.now() / 1000)) : Math.ceil(resetTime);
        if (delta > 0 && delta < 600) return Math.min(300, Math.max(5, delta));
      }
    }

    return defaultSeconds;
  }

  async executeWithRetry(operation, maxRetries = 1, baseDelayMs = 300) {
    let lastErr;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastErr = err;
        const status = err.status || 500;
        const { isServer } = this.classifyError(err, status);

        // Only retry on transient server errors (500, 502, 503, 504) or network errors
        if (!isServer || attempt >= maxRetries) {
          throw err;
        }

        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 100;
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw lastErr;
  }
}

