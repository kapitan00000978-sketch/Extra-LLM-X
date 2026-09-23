export class BaseProvider {
  constructor(name, displayName) {
    this.name = name;
    this.displayName = displayName;
  }

  // Returns list of free models supported/discovered by this provider
  async scanModels(apiKey) {
    throw new Error('scanModels not implemented');
  }

  // Execute a completion request (streaming or non-streaming)
  async complete({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    throw new Error('complete not implemented');
  }

  // Standardized error classifier
  classifyError(err, status) {
    const msg = (err.message || '').toLowerCase();
    const isRateLimit = status === 429 || msg.includes('rate limit') || msg.includes('quota') || msg.includes('too many requests') || msg.includes('exhausted');
    const isAuth = status === 401 || status === 403 || msg.includes('unauthorized') || msg.includes('invalid api key');
    const isServer = status >= 500;
    return { isRateLimit, isAuth, isServer };
  }
}
