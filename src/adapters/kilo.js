import { BaseAdapter } from './base.js';

export class KiloAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'kilo',
      name: 'Kilo Code & Gateway (Auto-Free)',
      badge: 'Zero-Key & BYOK Free',
      getKeyUrl: 'https://kilo.ai',
      guide: 'Supports free anonymous auto-routing or your Kilo API key for high-volume inference.',
      freeTierInfo: 'Free auto-tier with generous hourly quotas across open models',
      popularModels: 'kilo-auto/free, llama-3.3-70b, deepseek-r1:free, qwen-2.5-coder-32b',
      keyPrefix: 'kilo-',
      keyPlaceholder: 'kilo-... or leave blank for anonymous free'
    });
    this.baseUrl = 'https://api.kilo.ai/api/gateway';
    this.isNoAuth = true;
    this.freeModels = [
      { id: 'kilo-auto/free', name: 'Kilo Auto Free (Omni-Routed)', context: 131072, caps: 'chat,code,reasoning' },
      { id: 'deepseek-r1:free', name: 'Kilo DeepSeek R1 (Free)', context: 65536, caps: 'chat,reasoning' },
      { id: 'llama-3.3-70b', name: 'Kilo Llama 3.3 70B', context: 131072, caps: 'chat,code' },
      { id: 'qwen-2.5-coder-32b', name: 'Kilo Qwen 2.5 Coder 32B', context: 32768, caps: 'chat,code' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `kilo/${m.id}`,
      provider: 'kilo',
      model_id: m.id,
      display_name: `${m.name} [Kilo Free]`,
      description: 'Kilo AI Gateway Free Tier Inference',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^kilo\//, '');
    const body = {
      model: rawModel,
      messages,
      stream,
      temperature,
      max_tokens,
      ...(tools && tools.length ? { tools, tool_choice } : {})
    };

    const headers = {
      'Content-Type': 'application/json'
    };
    if (apiKey && apiKey.trim()) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Kilo API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
