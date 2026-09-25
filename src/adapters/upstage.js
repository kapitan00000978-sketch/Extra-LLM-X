import { BaseAdapter } from './base.js';

export class UpstageAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'upstage',
      name: 'Upstage Solar (Frontier Intelligence)',
      badge: 'Solar Frontier Engine',
      getKeyUrl: 'https://console.upstage.ai/api-keys',
      guide: 'Sign up on Upstage Console to get free trial credits for Solar Pro and Solar Mini.',
      freeTierInfo: 'Free trial credits on signup',
      popularModels: 'solar-pro, solar-mini',
      keyPrefix: 'up_',
      keyPlaceholder: 'up_...'
    });
    this.baseUrl = 'https://api.upstage.ai/v1/solar';
    this.freeModels = [
      { id: 'solar-pro', name: 'Upstage Solar Pro', context: 32768, caps: 'chat,reasoning,code' },
      { id: 'solar-mini', name: 'Upstage Solar Mini', context: 32768, caps: 'chat,fast' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `upstage/${m.id}`,
      provider: 'upstage',
      model_id: m.id,
      display_name: `${m.name} [Upstage Solar]`,
      description: 'Upstage Solar Frontier LLM',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    if (!apiKey) {
      const err = new Error('Upstage API key is required. Sign up at console.upstage.ai');
      err.status = 401;
      throw err;
    }
    const rawModel = model.replace(/^upstage\//, '');
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
      const err = new Error(`Upstage API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
