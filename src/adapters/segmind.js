import { BaseAdapter } from './base.js';

export class SegmindAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'segmind',
      name: 'Segmind',
      badge: 'Fast Generative AI',
      getKeyUrl: 'https://www.segmind.com/api-keys',
      guide: 'Generate API key on Segmind dashboard for fast text and image generation models.',
      freeTierInfo: '100 free requests per day permanent quota',
      popularModels: 'llama-3-8b-instruct, qwen-2.5-7b-instruct',
      keyPrefix: 'SG_',
      keyPlaceholder: 'SG_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.segmind.com/v1';
    this.freeModels = [
      {
            "id": "llama-3-8b-instruct",
            "name": "Segmind Llama 3 8B",
            "context": 8192,
            "caps": "chat,fast"
      },
      {
            "id": "qwen-2.5-7b-instruct",
            "name": "Segmind Qwen 2.5 7B",
            "context": 32768,
            "caps": "chat,code"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `segmind/${m.id}`,
      provider: 'segmind',
      model_id: m.id,
      display_name: `${m.name} [Segmind]`,
      description: 'Segmind Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^segmind\//, '');
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
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Segmind API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
