import { BaseAdapter } from './base.js';

export class MistralAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'mistral',
      name: 'Mistral AI',
      badge: 'Codestral Free',
      getKeyUrl: 'https://console.mistral.ai/api-keys/',
      guide: 'Create free account on Mistral La Plateforme and generate API Key.',
      freeTierInfo: 'Free developer tier for experimentation',
      popularModels: 'codestral-latest, mistral-small-latest',
      keyPrefix: '',
      keyPlaceholder: 'Paste Mistral API Key'
    });
    this.baseUrl = 'https://api.mistral.ai/v1';
    this.freeModels = [
      { id: 'codestral-latest', name: 'Codestral Latest', context: 32768, caps: 'chat,code' },
      { id: 'mistral-small-latest', name: 'Mistral Small Latest', context: 32768, caps: 'chat,code' },
      { id: 'open-mistral-nemo', name: 'Mistral Nemo (12B)', context: 128000, caps: 'chat' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `mistral/${m.id}`,
      provider: 'mistral',
      model_id: m.id,
      display_name: `${m.name} [Mistral Free Tier]`,
      description: 'Mistral AI Free Experimentation & Coding Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^mistral\//, '');
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
      const err = new Error(`Mistral API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
