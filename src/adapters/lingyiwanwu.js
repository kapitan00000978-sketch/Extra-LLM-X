import { BaseAdapter } from './base.js';

export class LingyiwanwuAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'lingyiwanwu',
      name: '01.AI (Yi)',
      badge: 'Open-Weights Lead',
      getKeyUrl: 'https://platform.lingyiwanwu.com/apikeys',
      guide: 'Generate API key on 01.AI platform for Yi Large and Yi Coder models.',
      freeTierInfo: 'Free trial compute quota on phone verification',
      popularModels: 'yi-large, yi-medium, yi-spark, yi-coder',
      keyPrefix: 'sk-',
      keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.lingyiwanwu.com/v1';
    this.freeModels = [
      {
            "id": "yi-large",
            "name": "Yi Large",
            "context": 32768,
            "caps": "chat,reasoning"
      },
      {
            "id": "yi-medium",
            "name": "Yi Medium",
            "context": 16384,
            "caps": "chat,fast"
      },
      {
            "id": "yi-spark",
            "name": "Yi Spark Lite",
            "context": 16384,
            "caps": "chat,fast"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `lingyiwanwu/${m.id}`,
      provider: 'lingyiwanwu',
      model_id: m.id,
      display_name: `${m.name} [01.AI (Yi)]`,
      description: '01.AI (Yi) Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^lingyiwanwu\//, '');
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
      const err = new Error(`01.AI (Yi) API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
