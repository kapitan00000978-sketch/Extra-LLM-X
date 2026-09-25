import { BaseAdapter } from './base.js';

export class ReplicateAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'replicate',
      name: 'Replicate',
      badge: 'Cloud Predictions',
      getKeyUrl: 'https://replicate.com/account/api-tokens',
      guide: 'Create an API token on Replicate dashboard for running open-source models in the cloud.',
      freeTierInfo: 'Free trial compute upon account setup',
      popularModels: 'meta/meta-llama-3.70b-instruct, deepseek-ai/deepseek-r1',
      keyPrefix: 'r8_',
      keyPlaceholder: 'r8_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.replicate.com/v1';
    this.freeModels = [
      {
            "id": "meta/meta-llama-3-70b-instruct",
            "name": "Replicate Llama 3 70B",
            "context": 8192,
            "caps": "chat,code"
      },
      {
            "id": "deepseek-ai/deepseek-r1",
            "name": "Replicate DeepSeek R1",
            "context": 32768,
            "caps": "chat,reasoning"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `replicate/${m.id}`,
      provider: 'replicate',
      model_id: m.id,
      display_name: `${m.name} [Replicate]`,
      description: 'Replicate Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^replicate\//, '');
    const body = { 
      model: rawModel, 
      messages, 
      stream, 
      ...(temperature !== undefined ? { temperature } : {}), 
      ...(max_tokens !== undefined ? { max_tokens } : {}),
      ...(tools?.length ? { tools, tool_choice } : {}) 
    };

    let targetUrl = `${this.baseUrl}/chat/completions`;
    
    // Replicate OpenAI compatibility proxy or native prediction translation
    targetUrl = `${this.baseUrl}/chat/completions`;
    

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Replicate API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
