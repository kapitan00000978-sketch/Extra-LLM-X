import { BaseAdapter } from './base.js';

export class TogetherAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'together',
      name: 'Together AI',
      badge: 'Free Tier / Credit',
      getKeyUrl: 'https://api.together.ai/settings/api-keys',
      guide: 'Sign up on Together AI and copy your free starter API key.',
      freeTierInfo: '$5.00 free credit on new signup',
      popularModels: 'meta-llama/Llama-3.3-70B-Instruct-Turbo, Qwen/Qwen2.5-72B-Instruct-Turbo',
      keyPrefix: '',
      keyPlaceholder: 'Paste Together AI API Key'
    });
    this.baseUrl = 'https://api.together.xyz/v1';
    this.freeModels = [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Together Llama 3.3 70B Turbo', context: 131072, caps: 'chat,code' },
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', name: 'Together Llama 3.1 8B Turbo', context: 131072, caps: 'chat,fast' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `together/${m.id}`,
      provider: 'together',
      model_id: m.id,
      display_name: `${m.name} [Together AI]`,
      description: 'Together AI Free Tier / Starter Inference',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^together\//, '');
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
      const err = new Error(`Together API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
