import { BaseAdapter } from './base.js';

export class BaichuanAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'baichuan',
      name: 'Baichuan AI (Frontier Chinese LLM)',
      badge: 'Baichuan-4 Flagship',
      getKeyUrl: 'https://platform.baichuan-ai.com/console/apikey',
      guide: 'Sign up on Baichuan AI developer platform to access Baichuan 4 and Baichuan 3 Turbo.',
      freeTierInfo: 'Free trial tokens on registration',
      popularModels: 'Baichuan4, Baichuan3-Turbo',
      keyPrefix: '',
      keyPlaceholder: 'Paste Baichuan API Key'
    });
    this.baseUrl = 'https://api.baichuan-ai.com/v1';
    this.freeModels = [
      { id: 'Baichuan4', name: 'Baichuan 4 Flagship', context: 32768, caps: 'chat,reasoning,code' },
      { id: 'Baichuan3-Turbo', name: 'Baichuan 3 Turbo', context: 32768, caps: 'chat,fast' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `baichuan/${m.id}`,
      provider: 'baichuan',
      model_id: m.id,
      display_name: `${m.name} [Baichuan AI]`,
      description: 'Baichuan Frontier Chinese Intelligence',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    if (!apiKey) {
      const err = new Error('Baichuan API key is required');
      err.status = 401;
      throw err;
    }
    const rawModel = model.replace(/^baichuan\//, '');
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
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Baichuan API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
