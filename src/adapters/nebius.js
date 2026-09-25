import { BaseAdapter } from './base.js';

export class NebiusAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'nebius',
      name: 'Nebius AI Studio',
      badge: 'H100 NVLink Cluster',
      getKeyUrl: 'https://studio.nebius.ai/settings/api-keys',
      guide: 'Generate API key in Nebius AI Studio for low-latency H100 inference.',
      freeTierInfo: '$10.00 free credit on registration',
      popularModels: 'meta-llama/Llama-3.3-70B-Instruct, deepseek-ai/DeepSeek-V3, Qwen/Qwen2.5-Coder-32B-Instruct',
      keyPrefix: '',
      keyPlaceholder: 'neb_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.studio.nebius.ai/v1';
    this.freeModels = [
      {
            "id": "meta-llama/Llama-3.3-70B-Instruct",
            "name": "Llama 3.3 70B (Nebius H100)",
            "context": 131072,
            "caps": "chat,code"
      },
      {
            "id": "deepseek-ai/DeepSeek-V3",
            "name": "DeepSeek V3 (Nebius)",
            "context": 64000,
            "caps": "chat,code,reasoning"
      },
      {
            "id": "Qwen/Qwen2.5-Coder-32B-Instruct",
            "name": "Qwen 2.5 Coder 32B (Nebius)",
            "context": 32768,
            "caps": "chat,code"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `nebius/${m.id}`,
      provider: 'nebius',
      model_id: m.id,
      display_name: `${m.name} [Nebius AI Studio]`,
      description: 'Nebius AI Studio Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^nebius\//, '');
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
      const err = new Error(`Nebius AI Studio API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
