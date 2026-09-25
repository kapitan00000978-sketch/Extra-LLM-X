import { BaseAdapter } from './base.js';

export class XaiAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'xai',
      name: 'xAI (Grok)',
      badge: 'Frontier AI',
      getKeyUrl: 'https://console.x.ai/',
      guide: 'Sign up on xAI Cloud Console, create an API key with free starter credits.',
      freeTierInfo: '$25 free starter credit for new developers',
      popularModels: 'grok-2-1212, grok-2-vision-1212, grok-beta',
      keyPrefix: 'xai-',
      keyPlaceholder: 'xai-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.x.ai/v1';
    this.freeModels = [
      {
            "id": "grok-2-1212",
            "name": "Grok 2 (1212)",
            "context": 131072,
            "caps": "chat,code,reasoning"
      },
      {
            "id": "grok-2-vision-1212",
            "name": "Grok 2 Vision (1212)",
            "context": 32768,
            "caps": "chat,vision,multimodal"
      },
      {
            "id": "grok-beta",
            "name": "Grok Beta",
            "context": 131072,
            "caps": "chat,code"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `xai/${m.id}`,
      provider: 'xai',
      model_id: m.id,
      display_name: `${m.name} [xAI (Grok)]`,
      description: 'xAI (Grok) Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^xai\//, '');
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
      const err = new Error(`xAI (Grok) API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
