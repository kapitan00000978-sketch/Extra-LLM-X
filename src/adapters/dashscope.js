import { BaseAdapter } from './base.js';

export class DashScopeAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'dashscope',
      name: 'Alibaba Cloud (Qwen / DashScope)',
      badge: 'International Tier',
      getKeyUrl: 'https://dashscope.console.aliyun.com/',
      guide: 'Create API key on Alibaba Cloud Model Studio / DashScope console.',
      freeTierInfo: '1,000,000 free tokens quota per model family',
      popularModels: 'qwen-max, qwen-plus, qwen-turbo, qwen2.5-coder-32b-instruct',
      keyPrefix: 'sk-',
      keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
    this.freeModels = [
      {
            "id": "qwen-turbo",
            "name": "Qwen 2.5 Turbo",
            "context": 131072,
            "caps": "chat,fast"
      },
      {
            "id": "qwen-plus",
            "name": "Qwen 2.5 Plus",
            "context": 131072,
            "caps": "chat,code,reasoning"
      },
      {
            "id": "qwen2.5-coder-32b-instruct",
            "name": "Qwen 2.5 Coder 32B",
            "context": 131072,
            "caps": "chat,code"
      },
      {
            "id": "qwen-max",
            "name": "Qwen 2.5 Max",
            "context": 32768,
            "caps": "chat,reasoning"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `dashscope/${m.id}`,
      provider: 'dashscope',
      model_id: m.id,
      display_name: `${m.name} [Alibaba Cloud (Qwen / DashScope)]`,
      description: 'Alibaba Cloud (Qwen / DashScope) Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^dashscope\//, '');
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
      const err = new Error(`Alibaba Cloud (Qwen / DashScope) API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
