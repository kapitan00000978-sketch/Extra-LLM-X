import { BaseAdapter } from './base.js';

export class InferenceNetAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'inference_net',
      name: 'Inference.net',
      badge: 'Open Compute',
      getKeyUrl: 'https://inference.net/dashboard',
      guide: 'Obtain API key on Inference.net for serverless open-source model execution.',
      freeTierInfo: 'Free developer tier for community models',
      popularModels: 'meta-llama/llama-3.3-70b-instruct, deepseek-ai/deepseek-r1',
      keyPrefix: 'inf_',
      keyPlaceholder: 'inf_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.inference.net/v1';
    this.freeModels = [
      {
            "id": "meta-llama/llama-3.3-70b-instruct",
            "name": "Inference.net Llama 3.3 70B",
            "context": 131072,
            "caps": "chat,code"
      },
      {
            "id": "deepseek-ai/deepseek-r1",
            "name": "Inference.net DeepSeek R1",
            "context": 64000,
            "caps": "chat,reasoning"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `inference_net/${m.id}`,
      provider: 'inference_net',
      model_id: m.id,
      display_name: `${m.name} [Inference.net]`,
      description: 'Inference.net Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^inference_net\//, '');
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
      const err = new Error(`Inference.net API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
