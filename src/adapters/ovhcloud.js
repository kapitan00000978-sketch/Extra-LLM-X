import { BaseAdapter } from './base.js';

export class OvhCloudAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'ovhcloud',
      name: 'OVHcloud AI Endpoints',
      badge: 'Sovereign Kepler',
      getKeyUrl: 'https://endpoints.kepler.ai.cloud.ovh.net/',
      guide: 'Generate Bearer token on OVHcloud AI Endpoints portal for open-source model inference.',
      freeTierInfo: 'Free test access tier available for developers',
      popularModels: 'Meta-Llama-3-1-70B-Instruct, Mistral-7B-Instruct-v0.3, DeepSeek-R1-Distill-Qwen-32B',
      keyPrefix: '',
      keyPlaceholder: 'ovh_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1';
    this.freeModels = [
      {
            "id": "Meta-Llama-3-1-70B-Instruct",
            "name": "OVH Llama 3.1 70B",
            "context": 128000,
            "caps": "chat,code"
      },
      {
            "id": "Mistral-7B-Instruct-v0.3",
            "name": "OVH Mistral 7B v0.3",
            "context": 32768,
            "caps": "chat,fast"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `ovhcloud/${m.id}`,
      provider: 'ovhcloud',
      model_id: m.id,
      display_name: `${m.name} [OVHcloud AI Endpoints]`,
      description: 'OVHcloud AI Endpoints Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^ovhcloud\//, '');
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
      const err = new Error(`OVHcloud AI Endpoints API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
