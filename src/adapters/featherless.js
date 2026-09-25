import { BaseAdapter } from './base.js';

export class FeatherlessAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'featherless',
      name: 'Featherless AI',
      badge: '1000+ Models',
      getKeyUrl: 'https://featherless.ai/account/api-keys',
      guide: 'Obtain API key on Featherless AI to access over 1,000 open-source fine-tunes.',
      freeTierInfo: 'Free trial access to open model catalog',
      popularModels: 'meta-llama/Meta-Llama-3.1-70B-Instruct, mistralai/Mistral-7B-Instruct-v0.3',
      keyPrefix: '',
      keyPlaceholder: 'feather_xxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.featherless.ai/v1';
    this.freeModels = [
      {
            "id": "meta-llama/Meta-Llama-3.1-70B-Instruct",
            "name": "Featherless Llama 3.1 70B",
            "context": 128000,
            "caps": "chat,code"
      },
      {
            "id": "mistralai/Mistral-7B-Instruct-v0.3",
            "name": "Featherless Mistral 7B",
            "context": 32768,
            "caps": "chat,fast"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `featherless/${m.id}`,
      provider: 'featherless',
      model_id: m.id,
      display_name: `${m.name} [Featherless AI]`,
      description: 'Featherless AI Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^featherless\//, '');
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
      const err = new Error(`Featherless AI API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
