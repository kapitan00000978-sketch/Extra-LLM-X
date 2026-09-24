import { BaseAdapter } from './base.js';

export class CerebrasAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'cerebras',
      name: 'Cerebras Cloud',
      badge: '2,000+ tok/s CS-3',
      getKeyUrl: 'https://cloud.cerebras.ai/',
      guide: 'Sign up on Cerebras Cloud, generate API Key under API Keys tab.',
      freeTierInfo: '30 req/min, 1M tokens/day free tier',
      popularModels: 'llama-3.3-70b, llama3.1-8b',
      keyPrefix: 'csk-',
      keyPlaceholder: 'csk-xxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.cerebras.ai/v1';
    this.freeModels = [
      { id: 'llama-3.3-70b', name: 'Cerebras Llama 3.3 70B', context: 128000, caps: 'chat,code,fast' },
      { id: 'llama3.1-8b', name: 'Cerebras Llama 3.1 8B', context: 8192, caps: 'chat,fast' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `cerebras/${m.id}`,
      provider: 'cerebras',
      model_id: m.id,
      display_name: `${m.name} [Cerebras 2000 tok/s]`,
      description: 'Cerebras Ultra-High-Speed CS-3 Wafer Scale Free Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^cerebras\//, '');
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
      const err = new Error(`Cerebras API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
