import { BaseAdapter } from './base.js';

export class VoyageAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'voyage',
      name: 'Voyage AI',
      badge: 'SOTA Embeddings',
      getKeyUrl: 'https://dash.voyageai.com/api-keys',
      guide: 'Sign up on Voyage AI dashboard for top-ranked text and code embeddings.',
      freeTierInfo: '50 Million Free Tokens on registration',
      popularModels: 'voyage-3, voyage-3-lite, voyage-code-3',
      keyPrefix: 'pa-',
      keyPlaceholder: 'pa-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.voyageai.com/v1';
    this.freeModels = [
      {
            "id": "voyage-3",
            "name": "Voyage 3 Embedding (1024d)",
            "context": 32000,
            "caps": "embedding"
      },
      {
            "id": "voyage-3-lite",
            "name": "Voyage 3 Lite Embedding (512d)",
            "context": 32000,
            "caps": "embedding"
      },
      {
            "id": "voyage-code-3",
            "name": "Voyage Code 3 Embedding (1024d)",
            "context": 32000,
            "caps": "embedding,code"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `voyage/${m.id}`,
      provider: 'voyage',
      model_id: m.id,
      display_name: `${m.name} [Voyage AI]`,
      description: 'Voyage AI Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^voyage\//, '');
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
      const err = new Error(`Voyage AI API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
