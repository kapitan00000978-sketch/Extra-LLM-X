import { BaseAdapter } from './base.js';

export class HyperbolicAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'hyperbolic',
      name: 'Hyperbolic',
      badge: 'Open-Access Compute',
      getKeyUrl: 'https://app.hyperbolic.xyz/settings',
      guide: 'Sign up on Hyperbolic app, generate developer API Key with free compute credits.',
      freeTierInfo: 'Free developer tier & credits for open-weights models',
      popularModels: 'meta-llama/Llama-3.3-70B-Instruct, Qwen/Qwen2.5-Coder-32B-Instruct',
      keyPrefix: '',
      keyPlaceholder: 'hyp_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.hyperbolic.xyz/v1';
    this.freeModels = [
      { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Hyperbolic Llama 3.3 70B', context: 128000, caps: 'chat,code' },
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct', name: 'Hyperbolic Llama 3.1 8B', context: 128000, caps: 'chat,fast' },
      { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Hyperbolic Qwen 2.5 Coder 32B', context: 32768, caps: 'chat,code' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'Hyperbolic DeepSeek V3', context: 65536, caps: 'chat,code,reasoning' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `hyperbolic/${m.id}`,
      provider: 'hyperbolic',
      model_id: m.id,
      display_name: `${m.name} [Hyperbolic Free]`,
      description: 'Hyperbolic High-Performance Open Source Decentralized Inference',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^hyperbolic\//, '');
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
      const err = new Error(`Hyperbolic API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
