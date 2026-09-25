import { BaseAdapter } from './base.js';

export class Ai21Adapter extends BaseAdapter {
  constructor() {
    super({
      id: 'ai21',
      name: 'AI21 Labs',
      badge: 'Jamba Mamba+Transformer',
      getKeyUrl: 'https://studio.ai21.com/account/api-key',
      guide: 'Generate an API key on AI21 Studio for Jamba hybrid SSM-Transformer inference.',
      freeTierInfo: '$10.00 free credit on signup valid for 3 months',
      popularModels: 'jamba-1.5-mini, jamba-1.5-large, jamba-instruct',
      keyPrefix: '',
      keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.ai21.com/studio/v1';
    this.freeModels = [
      {
            "id": "jamba-1.5-mini",
            "name": "Jamba 1.5 Mini (SSM-Transformer)",
            "context": 256000,
            "caps": "chat,fast,long-context"
      },
      {
            "id": "jamba-1.5-large",
            "name": "Jamba 1.5 Large",
            "context": 256000,
            "caps": "chat,code,reasoning"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `ai21/${m.id}`,
      provider: 'ai21',
      model_id: m.id,
      display_name: `${m.name} [AI21 Labs]`,
      description: 'AI21 Labs Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^ai21\//, '');
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
      const err = new Error(`AI21 Labs API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
