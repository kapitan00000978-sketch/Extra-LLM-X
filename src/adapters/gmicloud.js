import { BaseAdapter } from './base.js';

export class GmiCloudAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'gmicloud',
      name: 'GMI Cloud Inference',
      badge: 'Enterprise GPUs',
      getKeyUrl: 'https://gmicloud.ai/dashboard/api-keys',
      guide: 'Create API token on GMI Cloud Console for dedicated GPU model inference.',
      freeTierInfo: 'Free trial starter credits on registration',
      popularModels: 'meta-llama/llama-3.3-70b-instruct, qwen/qwen-2.5-coder-32b',
      keyPrefix: 'gmi_',
      keyPlaceholder: 'gmi_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.gmicloud.ai/v1';
    this.freeModels = [
      {
            "id": "meta-llama/llama-3.3-70b-instruct",
            "name": "GMI Cloud Llama 3.3 70B",
            "context": 131072,
            "caps": "chat,code"
      },
      {
            "id": "qwen/qwen-2.5-coder-32b",
            "name": "GMI Qwen 2.5 Coder 32B",
            "context": 32768,
            "caps": "chat,code"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `gmicloud/${m.id}`,
      provider: 'gmicloud',
      model_id: m.id,
      display_name: `${m.name} [GMI Cloud Inference]`,
      description: 'GMI Cloud Inference Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^gmicloud\//, '');
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
      const err = new Error(`GMI Cloud Inference API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
