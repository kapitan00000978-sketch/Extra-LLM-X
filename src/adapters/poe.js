import { BaseAdapter } from './base.js';

export class PoeAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'poe',
      name: 'Poe API (Quora)',
      badge: 'Multi-Bot Hub',
      getKeyUrl: 'https://poe.com/api_key',
      guide: 'Generate an API key on Poe.com settings to interact with standard Poe bots.',
      freeTierInfo: 'Free daily compute points for registered Poe users',
      popularModels: 'Claude-3.5-Sonnet, GPT-4o-Mini, Llama-3.3-70B-T',
      keyPrefix: 'p-',
      keyPlaceholder: 'p-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.poe.com/v1';
    this.freeModels = [
      {
            "id": "Llama-3.3-70B-T",
            "name": "Poe Llama 3.3 70B",
            "context": 128000,
            "caps": "chat,code"
      },
      {
            "id": "GPT-4o-Mini",
            "name": "Poe GPT-4o Mini",
            "context": 128000,
            "caps": "chat,fast"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `poe/${m.id}`,
      provider: 'poe',
      model_id: m.id,
      display_name: `${m.name} [Poe API (Quora)]`,
      description: 'Poe API (Quora) Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^poe\//, '');
    const body = { 
      model: rawModel, 
      messages, 
      stream, 
      ...(temperature !== undefined ? { temperature } : {}), 
      ...(max_tokens !== undefined ? { max_tokens } : {}),
      ...(tools?.length ? { tools, tool_choice } : {}) 
    };

    let targetUrl = `${this.baseUrl}/chat/completions`;
    

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Poe API (Quora) API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
