import { BaseAdapter } from './base.js';

export class IflytekAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'iflytek',
      name: 'iFlytek Spark',
      badge: 'Cognitive Engine',
      getKeyUrl: 'https://xinghuo.xfyun.cn/sparkapi',
      guide: 'Register on iFlytek Spark Open Platform and obtain API key credentials.',
      freeTierInfo: 'Spark Lite is permanently free with unlimited queries',
      popularModels: 'general, generalv3, lite',
      keyPrefix: 'sk-',
      keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://spark-api-open.xf-yun.com/v1';
    this.freeModels = [
      {
            "id": "lite",
            "name": "Spark Lite (Free Forever)",
            "context": 8192,
            "caps": "chat,fast"
      },
      {
            "id": "general",
            "name": "Spark V3.5 Pro",
            "context": 8192,
            "caps": "chat,code"
      },
      {
            "id": "generalv3",
            "name": "Spark Ultra",
            "context": 32768,
            "caps": "chat,reasoning"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `iflytek/${m.id}`,
      provider: 'iflytek',
      model_id: m.id,
      display_name: `${m.name} [iFlytek Spark]`,
      description: 'iFlytek Spark Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^iflytek\//, '');
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
      const err = new Error(`iFlytek Spark API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
