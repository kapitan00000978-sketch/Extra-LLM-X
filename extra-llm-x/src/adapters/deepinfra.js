import { BaseAdapter } from './base.js';

export class DeepInfraAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'deepinfra',
      name: 'DeepInfra',
      badge: 'Free Tier Credits',
      getKeyUrl: 'https://deepinfra.com/dash/api_keys',
      guide: 'Sign up on DeepInfra to claim free initial developer trial credits.',
      freeTierInfo: 'Free credits on signup for open-source models',
      popularModels: 'meta-llama/Llama-3.3-70B-Instruct, deepseek-ai/DeepSeek-R1',
      keyPrefix: '',
      keyPlaceholder: 'Paste DeepInfra API Key'
    });
    this.baseUrl = 'https://api.deepinfra.com/v1/openai';
    this.freeModels = [
      { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'DeepInfra Llama 3.3 70B', context: 131072, caps: 'chat,code' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepInfra DeepSeek R1', context: 64000, caps: 'chat,reasoning' },
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct', name: 'DeepInfra Llama 3.1 8B', context: 131072, caps: 'chat,fast' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `deepinfra/${m.id}`,
      provider: 'deepinfra',
      model_id: m.id,
      display_name: `${m.name} [DeepInfra]`,
      description: 'DeepInfra Developer Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^deepinfra\//, '');
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
      const err = new Error(`DeepInfra API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
