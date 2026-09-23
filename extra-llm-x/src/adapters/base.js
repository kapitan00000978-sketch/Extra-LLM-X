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
}
