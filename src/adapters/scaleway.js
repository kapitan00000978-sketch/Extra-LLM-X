import { BaseAdapter } from './base.js';

export class ScalewayAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'scaleway',
      name: 'Scaleway Generative APIs',
      badge: 'European Sovereign',
      getKeyUrl: 'https://console.scaleway.com/iam/api-keys',
      guide: 'Generate API key in Scaleway European cloud console for Generative AI endpoints.',
      freeTierInfo: 'Free starter tier with generous monthly requests',
      popularModels: 'llama-3.3-70b-instruct, deepseek-r1-distill-llama-70b, bge-multilingual-gemma2',
      keyPrefix: '',
      keyPlaceholder: 'scw_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.scaleway.ai/v1';
    this.freeModels = [
      {
            "id": "llama-3.3-70b-instruct",
            "name": "Scaleway Llama 3.3 70B",
            "context": 131072,
            "caps": "chat,code"
      },
      {
            "id": "deepseek-r1-distill-llama-70b",
            "name": "Scaleway DeepSeek-R1 Distill 70B",
            "context": 131072,
            "caps": "chat,reasoning"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `scaleway/${m.id}`,
      provider: 'scaleway',
      model_id: m.id,
      display_name: `${m.name} [Scaleway Generative APIs]`,
      description: 'Scaleway Generative APIs Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^scaleway\//, '');
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
      const err = new Error(`Scaleway Generative APIs API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
