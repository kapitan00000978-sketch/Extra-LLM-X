import { BaseAdapter } from './base.js';

export class VolcengineAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'volcengine',
      name: 'ByteDance Volcengine (Doubao)',
      badge: 'Doubao LLM',
      getKeyUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
      guide: 'Generate API key in ByteDance Volcano Engine Ark console.',
      freeTierInfo: '500,000 free tokens on Doubao model endpoints',
      popularModels: 'doubao-pro-4k, doubao-lite-4k, doubao-pro-32k',
      keyPrefix: 'sk-',
      keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';
    this.freeModels = [
      {
            "id": "doubao-lite-4k",
            "name": "Doubao Lite 4K",
            "context": 4096,
            "caps": "chat,fast"
      },
      {
            "id": "doubao-pro-4k",
            "name": "Doubao Pro 4K",
            "context": 4096,
            "caps": "chat,code"
      },
      {
            "id": "doubao-pro-32k",
            "name": "Doubao Pro 32K",
            "context": 32768,
            "caps": "chat,long-context"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `volcengine/${m.id}`,
      provider: 'volcengine',
      model_id: m.id,
      display_name: `${m.name} [ByteDance Volcengine (Doubao)]`,
      description: 'ByteDance Volcengine (Doubao) Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^volcengine\//, '');
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
      const err = new Error(`ByteDance Volcengine (Doubao) API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
