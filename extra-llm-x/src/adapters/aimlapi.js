import { BaseAdapter } from './base.js';

export class AimlApiAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'aimlapi',
      name: 'AIML API',
      badge: '100+ Models Gateway',
      getKeyUrl: 'https://aimlapi.com/app/keys',
      guide: 'Sign up on AIML API, obtain free developer trial credits, generate API key.',
      freeTierInfo: 'Free developer starter credits across 100+ AI models',
      popularModels: 'meta-llama/Llama-3.3-70B-Instruct-Turbo, Qwen/Qwen2.5-72B-Instruct',
      keyPrefix: '',
      keyPlaceholder: 'aiml_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.aimlapi.com/v1';
    this.freeModels = [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'AIML Llama 3.3 70B Turbo', context: 128000, caps: 'chat,code' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'AIML Qwen 2.5 72B Instruct', context: 65536, caps: 'chat,code' },
      { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'AIML Mistral 7B v0.3', context: 32768, caps: 'chat,fast' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `aimlapi/${m.id}`,
      provider: 'aimlapi',
      model_id: m.id,
      display_name: `${m.name} [AIML Free Tier]`,
      description: 'AIML API Unified Multi-Model High Availability Gateway',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^aimlapi\//, '');
    const body = {
      model: rawModel,
      messages,
      stream,
      temperature,
      max_tokens,
      ...(tools && tools.length ? { tools, tool_choice } : {})
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`AIML API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
