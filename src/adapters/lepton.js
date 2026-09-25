import { BaseAdapter } from './base.js';

export class LeptonAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'lepton',
      name: 'Lepton AI',
      badge: 'Fast Serverless',
      getKeyUrl: 'https://dashboard.lepton.ai/credentials',
      guide: 'Generate Workspace Token on Lepton AI dashboard for 500+ tok/s serverless models.',
      freeTierInfo: '$10.00 free credit on workspace creation',
      popularModels: 'llama3-3-70b, deepseek-r1, qwen2-5-coder-32b',
      keyPrefix: '',
      keyPlaceholder: 'lepton_token_xxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.lepton.ai/v1';
    this.freeModels = [
      {
            "id": "llama3-3-70b",
            "name": "Lepton Llama 3.3 70B",
            "context": 128000,
            "caps": "chat,code"
      },
      {
            "id": "deepseek-r1",
            "name": "Lepton DeepSeek R1",
            "context": 64000,
            "caps": "chat,reasoning"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `lepton/${m.id}`,
      provider: 'lepton',
      model_id: m.id,
      display_name: `${m.name} [Lepton AI]`,
      description: 'Lepton AI Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^lepton\//, '');
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
      const err = new Error(`Lepton AI API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
