import { BaseAdapter } from './base.js';

export class NlpCloudAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'nlpcloud',
      name: 'NLP Cloud',
      badge: 'NLP Microservices',
      getKeyUrl: 'https://nlpcloud.com/home/token',
      guide: 'Obtain API token on NLP Cloud console for production-ready open models.',
      freeTierInfo: '1 free request per minute free forever plan',
      popularModels: 'finetuned-llama-3-70b, dolphin',
      keyPrefix: '',
      keyPlaceholder: 'nlpcloud_token_xxxxxxxx'
    });
    this.baseUrl = 'https://api.nlpcloud.io/v1';
    this.freeModels = [
      {
            "id": "finetuned-llama-3-70b",
            "name": "NLP Cloud Llama 3 70B",
            "context": 8192,
            "caps": "chat,code"
      },
      {
            "id": "dolphin",
            "name": "NLP Cloud Dolphin",
            "context": 8192,
            "caps": "chat,fast"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `nlpcloud/${m.id}`,
      provider: 'nlpcloud',
      model_id: m.id,
      display_name: `${m.name} [NLP Cloud]`,
      description: 'NLP Cloud Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^nlpcloud\//, '');
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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${apiKey}` },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`NLP Cloud API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
