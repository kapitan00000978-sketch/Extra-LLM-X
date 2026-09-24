import { BaseAdapter } from './base.js';

export class NovitaAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'novita',
      name: 'Novita AI',
      badge: 'Trial Credits',
      getKeyUrl: 'https://novita.ai/settings/key-management',
      guide: 'Sign up on Novita AI to receive starter credits.',
      freeTierInfo: 'Trial credit for open models',
      popularModels: 'meta-llama/llama-3.3-70b-instruct, deepseek/deepseek-r1',
      keyPrefix: '',
      keyPlaceholder: 'Paste Novita AI Key'
    });
    this.baseUrl = 'https://api.novita.ai/v3/openai';
    this.freeModels = [
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Novita Llama 3.3 70B', context: 131072, caps: 'chat,code' },
      { id: 'deepseek/deepseek-r1', name: 'Novita DeepSeek R1', context: 64000, caps: 'chat,reasoning' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `novita/${m.id}`,
      provider: 'novita',
      model_id: m.id,
      display_name: `${m.name} [Novita AI]`,
      description: 'Novita AI Developer Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^novita\//, '');
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
      const err = new Error(`Novita API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
