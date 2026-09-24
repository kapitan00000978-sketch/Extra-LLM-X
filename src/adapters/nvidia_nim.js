import { BaseAdapter } from './base.js';

export class NvidiaNimAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'nvidia',
      name: 'NVIDIA NIM',
      badge: '1,000 Free Credits',
      getKeyUrl: 'https://build.nvidia.com/',
      guide: 'Sign up with NVIDIA Developer account to receive 1,000 free inference credits.',
      freeTierInfo: '1,000 free credits on signup, enterprise DGX Cloud infrastructure',
      popularModels: 'meta/llama-3.3-70b-instruct, deepseek-ai/deepseek-r1, nvidia/llama-3.1-nemotron-70b-instruct',
      keyPrefix: 'nvapi-',
      keyPlaceholder: 'nvapi-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://integrate.api.nvidia.com/v1';
    this.freeModels = [
      { id: 'meta/llama-3.3-70b-instruct', name: 'NVIDIA Llama 3.3 70B', context: 131072, caps: 'chat,code' },
      { id: 'deepseek-ai/deepseek-r1', name: 'NVIDIA DeepSeek R1', context: 64000, caps: 'chat,reasoning' },
      { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'NVIDIA Nemotron 70B', context: 131072, caps: 'chat,code,reasoning' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `nvidia/${m.id}`,
      provider: 'nvidia',
      model_id: m.id,
      display_name: `${m.name} [NVIDIA NIM]`,
      description: 'NVIDIA NIM DGX Cloud High-Performance Inference',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^nvidia\//, '');
    const body = {
      model: rawModel,
      messages,
      stream,
      temperature,
      max_tokens,
      ...(tools && tools.length ? { tools, tool_choice } : {})
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`NVIDIA NIM API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
