import { BaseAdapter } from './base.js';

export class VertexAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'vertex',
      name: 'Google Cloud Vertex AI',
      badge: 'Enterprise Vertex',
      getKeyUrl: 'https://console.cloud.google.com/vertex-ai',
      guide: 'Generate Google Cloud OAuth2 token or service account for enterprise Vertex AI.',
      freeTierInfo: '$300 Google Cloud free trial credit',
      popularModels: 'gemini-1.5-pro, gemini-1.5-flash, claude-3-5-sonnet-v2',
      keyPrefix: '',
      keyPlaceholder: 'ya29.xxxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
    this.freeModels = [
      {
            "id": "gemini-1.5-flash",
            "name": "Vertex Gemini 1.5 Flash",
            "context": 1000000,
            "caps": "chat,fast,vision"
      },
      {
            "id": "gemini-1.5-pro",
            "name": "Vertex Gemini 1.5 Pro",
            "context": 2000000,
            "caps": "chat,reasoning,code"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `vertex/${m.id}`,
      provider: 'vertex',
      model_id: m.id,
      display_name: `${m.name} [Google Cloud Vertex AI]`,
      description: 'Google Cloud Vertex AI Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^vertex\//, '');
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
      const err = new Error(`Google Cloud Vertex AI API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
