import { BaseAdapter } from './base.js';

export class JinaAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'jina',
      name: 'Jina AI',
      badge: 'Search & Embeddings',
      getKeyUrl: 'https://jina.ai/embeddings/',
      guide: 'Obtain Jina AI Bearer token for multilingual embeddings and rerankers.',
      freeTierInfo: '10 Million Free Tokens permanent allowance',
      popularModels: 'jina-embeddings-v3, jina-reranker-v2-base-multilingual, jina-deepsearch-v1',
      keyPrefix: 'jina_',
      keyPlaceholder: 'jina_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.jina.ai/v1';
    this.freeModels = [
      {
            "id": "jina-embeddings-v3",
            "name": "Jina Embeddings v3 (1024d)",
            "context": 8192,
            "caps": "embedding"
      },
      {
            "id": "jina-deepsearch-v1",
            "name": "Jina DeepSearch Reader",
            "context": 64000,
            "caps": "chat,search"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `jina/${m.id}`,
      provider: 'jina',
      model_id: m.id,
      display_name: `${m.name} [Jina AI]`,
      description: 'Jina AI Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^jina\//, '');
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
      const err = new Error(`Jina AI API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
