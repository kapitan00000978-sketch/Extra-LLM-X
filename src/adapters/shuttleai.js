import { BaseAdapter } from './base.js';

export class ShuttleAIAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'shuttleai',
      name: 'ShuttleAI (Frontier Aggregator)',
      badge: 'Frontier & Multimodal Proxy',
      getKeyUrl: 'https://shuttleai.com/keys',
      guide: 'Sign up on ShuttleAI to get free credits and proxy access to OpenAI, Anthropic, and open-weights models.',
      freeTierInfo: 'Free starter tier & multi-model BYOK',
      popularModels: 'shuttle-2.5, claude-3-5-sonnet, gpt-4o, deepseek-r1',
      keyPrefix: 'shuttle-',
      keyPlaceholder: 'shuttle-...'
    });
    this.baseUrl = 'https://api.shuttleai.com/v1';
    this.freeModels = [
      { id: 'shuttle-2.5', name: 'Shuttle 2.5 Fast', context: 128000, caps: 'chat,fast,code' },
      { id: 'claude-3-5-sonnet', name: 'Shuttle Claude 3.5 Sonnet', context: 200000, caps: 'chat,code,reasoning' },
      { id: 'gpt-4o', name: 'Shuttle GPT-4o', context: 128000, caps: 'chat,code,vision' },
      { id: 'deepseek-r1', name: 'Shuttle DeepSeek R1', context: 65536, caps: 'chat,reasoning' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `shuttleai/${m.id}`,
      provider: 'shuttleai',
      model_id: m.id,
      display_name: `${m.name} [ShuttleAI]`,
      description: 'ShuttleAI Multi-Model Gateway',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^shuttleai\//, '');
    const body = {
      model: rawModel,
      messages,
      stream,
      temperature,
      max_tokens,
      ...(tools && tools.length ? { tools, tool_choice } : {})
    };

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey && apiKey.trim()) headers['Authorization'] = `Bearer ${apiKey.trim()}`;

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`ShuttleAI API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
