import { BaseAdapter } from './base.js';

export class RekaAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'reka',
      name: 'Reka AI',
      badge: 'Multimodal Research',
      getKeyUrl: 'https://platform.reka.ai/',
      guide: 'Sign up on Reka Platform and create API Key for Flash and Core multimodal models.',
      freeTierInfo: 'Free developer starter credits upon account creation',
      popularModels: 'reka-flash, reka-core, reka-edge',
      keyPrefix: '',
      keyPlaceholder: 'rek_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.reka.ai/v1';
    this.freeModels = [
      {
            "id": "reka-flash",
            "name": "Reka Flash",
            "context": 128000,
            "caps": "chat,vision,code"
      },
      {
            "id": "reka-core",
            "name": "Reka Core",
            "context": 128000,
            "caps": "chat,reasoning,multimodal"
      },
      {
            "id": "reka-edge",
            "name": "Reka Edge",
            "context": 32768,
            "caps": "chat,fast"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `reka/${m.id}`,
      provider: 'reka',
      model_id: m.id,
      display_name: `${m.name} [Reka AI]`,
      description: 'Reka AI Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^reka\//, '');
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
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Reka AI API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
