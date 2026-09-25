import { BaseAdapter } from './base.js';

export class MoonshotAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'moonshot',
      name: 'Moonshot AI (Kimi)',
      badge: 'Long-Context',
      getKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
      guide: 'Obtain API key on Moonshot Developer Platform for 128k/200k context Kimi models.',
      freeTierInfo: '15 RMB (~$2) free credit on account verification',
      popularModels: 'moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k',
      keyPrefix: 'sk-',
      keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.moonshot.cn/v1';
    this.freeModels = [
      {
            "id": "moonshot-v1-8k",
            "name": "Moonshot Kimi 8K",
            "context": 8192,
            "caps": "chat,code"
      },
      {
            "id": "moonshot-v1-32k",
            "name": "Moonshot Kimi 32K",
            "context": 32768,
            "caps": "chat,code,long-context"
      },
      {
            "id": "moonshot-v1-128k",
            "name": "Moonshot Kimi 128K",
            "context": 131072,
            "caps": "chat,long-context,reasoning"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `moonshot/${m.id}`,
      provider: 'moonshot',
      model_id: m.id,
      display_name: `${m.name} [Moonshot AI (Kimi)]`,
      description: 'Moonshot AI (Kimi) Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^moonshot\//, '');
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
      const err = new Error(`Moonshot AI (Kimi) API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
