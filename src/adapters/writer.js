import { BaseAdapter } from './base.js';

export class WriterAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'writer',
      name: 'Writer (Palmyra)',
      badge: 'Enterprise Palmyra',
      getKeyUrl: 'https://dev.writer.com/',
      guide: 'Obtain API key on Writer Developer Portal for enterprise Palmyra LLMs.',
      freeTierInfo: 'Free trial developer credits on sign up',
      popularModels: 'palmyra-x-004, palmyra-med-70b, palmyra-fin-70b',
      keyPrefix: '',
      keyPlaceholder: 'wrt_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.writer.com/v1';
    this.freeModels = [
      {
            "id": "palmyra-x-004",
            "name": "Palmyra X 004",
            "context": 128000,
            "caps": "chat,code,reasoning"
      },
      {
            "id": "palmyra-med-70b",
            "name": "Palmyra Medical 70B",
            "context": 32768,
            "caps": "chat,reasoning"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `writer/${m.id}`,
      provider: 'writer',
      model_id: m.id,
      display_name: `${m.name} [Writer (Palmyra)]`,
      description: 'Writer (Palmyra) Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^writer\//, '');
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
      const err = new Error(`Writer (Palmyra) API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
