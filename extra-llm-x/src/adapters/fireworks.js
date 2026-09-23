import { BaseAdapter } from './base.js';

export class FireworksAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'fireworks',
      name: 'Fireworks AI',
      badge: 'Free Developer Credits',
      getKeyUrl: 'https://fireworks.ai/api-keys',
      guide: 'Sign up on Fireworks AI to receive instant free developer credits.',
      freeTierInfo: 'Free credits on signup for fast inference',
      popularModels: 'accounts/fireworks/models/llama-v3p3-70b-instruct, accounts/fireworks/models/deepseek-r1',
      keyPrefix: 'fw_',
      keyPlaceholder: 'fw_xxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.fireworks.ai/inference/v1';
    this.freeModels = [
      { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'Fireworks Llama 3.3 70B', context: 131072, caps: 'chat,code' },
      { id: 'accounts/fireworks/models/deepseek-r1', name: 'Fireworks DeepSeek R1', context: 64000, caps: 'chat,reasoning' },
      { id: 'accounts/fireworks/models/llama-v3p1-8b-instruct', name: 'Fireworks Llama 3.1 8B', context: 131072, caps: 'chat,fast' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `fireworks/${m.id}`,
      provider: 'fireworks',
      model_id: m.id,
      display_name: `${m.name} [Fireworks AI]`,
      description: 'Fireworks AI Developer Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^fireworks\//, '');
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
      const err = new Error(`Fireworks API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
