import { BaseAdapter } from './base.js';

export class SenseNovaAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'sensenova',
      name: 'SenseTime SenseNova (Frontier LLM)',
      badge: 'SenseNova 5.5 Flagship',
      getKeyUrl: 'https://platform.sensenova.cn',
      guide: 'Sign up on SenseTime SenseNova platform for SenseChat 5.5 frontier models.',
      freeTierInfo: 'Free developer test credits',
      popularModels: 'SenseChat-5, SenseChat-5-Cantonese',
      keyPrefix: '',
      keyPlaceholder: 'Paste SenseNova API Key'
    });
    this.baseUrl = 'https://api.sensenova.cn/compatible-mode/v1';
    this.freeModels = [
      { id: 'SenseChat-5', name: 'SenseTime SenseChat 5.5', context: 32768, caps: 'chat,reasoning,code' },
      { id: 'SenseChat-5-Cantonese', name: 'SenseTime SenseChat Cantonese', context: 32768, caps: 'chat,fast' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `sensenova/${m.id}`,
      provider: 'sensenova',
      model_id: m.id,
      display_name: `${m.name} [SenseTime]`,
      description: 'SenseTime Frontier LLM',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    if (!apiKey) {
      const err = new Error('SenseNova API key is required');
      err.status = 401;
      throw err;
    }
    const rawModel = model.replace(/^sensenova\//, '');
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
      const err = new Error(`SenseNova API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
