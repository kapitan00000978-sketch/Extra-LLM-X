import { BaseAdapter } from './base.js';

export class PerplexityAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'perplexity',
      name: 'Perplexity AI',
      badge: 'Web-Grounded',
      getKeyUrl: 'https://www.perplexity.ai/settings/api',
      guide: 'Generate an API key in Perplexity settings for online grounded reasoning.',
      freeTierInfo: '$5 free trial credit on developer signup',
      popularModels: 'sonar-pro, sonar, sonar-reasoning',
      keyPrefix: 'pplx-',
      keyPlaceholder: 'pplx-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.perplexity.ai';
    this.freeModels = [
      {
            "id": "sonar",
            "name": "Sonar Search (Online)",
            "context": 128000,
            "caps": "chat,search,web"
      },
      {
            "id": "sonar-pro",
            "name": "Sonar Pro Deep Search",
            "context": 200000,
            "caps": "chat,search,reasoning"
      },
      {
            "id": "sonar-reasoning",
            "name": "Sonar Reasoning",
            "context": 128000,
            "caps": "chat,reasoning,search"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `perplexity/${m.id}`,
      provider: 'perplexity',
      model_id: m.id,
      display_name: `${m.name} [Perplexity AI]`,
      description: 'Perplexity AI Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^perplexity\//, '');
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
      const err = new Error(`Perplexity AI API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
