import { BaseAdapter } from './base.js';

export class LMStudioAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'lmstudio',
      name: 'Local LM Studio',
      badge: 'Local GUI Runner',
      getKeyUrl: 'https://lmstudio.ai/',
      guide: 'Start local server in LM Studio (default port 1234), auto-detected.',
      freeTierInfo: 'Unlimited, 100% private locally on your GPU/CPU',
      popularModels: 'Loaded local model',
      keyPrefix: '',
      keyPlaceholder: 'No key needed (Localhost)'
    });
    this.baseUrl = process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234/v1';
  }

  async discoverModels(apiKey) {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          return data.data.map(m => ({
            id: `lmstudio/${m.id}`,
            provider: 'lmstudio',
            model_id: m.id,
            display_name: `${m.id} [Local LM Studio]`,
            description: 'Loaded model in LM Studio local runtime',
            context_window: 32768,
            is_free: 1,
            capabilities: 'chat,code'
          }));
        }
      }
    } catch {
      // LM Studio not running
    }
    return [];
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^lmstudio\//, '');
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`LM Studio error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
