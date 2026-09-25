import { BaseAdapter } from './base.js';

export class BasetenAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'baseten',
      name: 'Baseten',
      badge: 'Truss Serverless',
      getKeyUrl: 'https://app.baseten.co/settings/api_keys',
      guide: 'Create an API Key on Baseten to access high-throughput model deployments.',
      freeTierInfo: '$30 free starter trial credits',
      popularModels: 'llama-3.3-70b-instruct, mistral-nemo-12b',
      keyPrefix: '',
      keyPlaceholder: 'baseten_key_xxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://bridge.baseten.co/v1';
    this.freeModels = [
      {
            "id": "llama-3.3-70b-instruct",
            "name": "Baseten Llama 3.3 70B",
            "context": 128000,
            "caps": "chat,code"
      },
      {
            "id": "mistral-nemo-12b",
            "name": "Baseten Mistral Nemo 12B",
            "context": 128000,
            "caps": "chat,fast"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `baseten/${m.id}`,
      provider: 'baseten',
      model_id: m.id,
      display_name: `${m.name} [Baseten]`,
      description: 'Baseten Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^baseten\//, '');
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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Api-Key ${apiKey}` },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Baseten API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
