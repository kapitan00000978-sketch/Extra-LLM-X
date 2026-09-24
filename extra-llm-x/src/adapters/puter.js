import { BaseAdapter } from './base.js';

export class PuterAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'puter',
      name: 'Puter AI (Open Cloud)',
      badge: 'Zero-Key & Free Cloud',
      getKeyUrl: 'https://puter.com/dashboard',
      guide: 'Puter provides free cloud-hosted AI inference. Use without key or provide your Puter token for higher limits.',
      freeTierInfo: 'Free browser/cloud quota across top frontier models',
      popularModels: 'gpt-4o-mini, claude-3-5-sonnet, deepseek-r1, llama-3.3-70b',
      keyPrefix: 'puter-',
      keyPlaceholder: 'puter-... or leave blank for free tier'
    });
    this.baseUrl = 'https://api.puter.com/puterai/openai/v1';
    this.isNoAuth = true;
    this.freeModels = [
      { id: 'gpt-4o-mini', name: 'Puter GPT-4o Mini', context: 128000, caps: 'chat,code,vision' },
      { id: 'claude-3-5-sonnet', name: 'Puter Claude 3.5 Sonnet', context: 200000, caps: 'chat,code,reasoning' },
      { id: 'deepseek-r1', name: 'Puter DeepSeek R1', context: 65536, caps: 'chat,reasoning' },
      { id: 'llama-3.3-70b', name: 'Puter Llama 3.3 70B', context: 131072, caps: 'chat,code' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `puter/${m.id}`,
      provider: 'puter',
      model_id: m.id,
      display_name: `${m.name} [Puter Free]`,
      description: 'Puter Cloud Free Inference Endpoint',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^puter\//, '');
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
      const err = new Error(`Puter API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
