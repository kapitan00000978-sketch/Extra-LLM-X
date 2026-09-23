import { BaseProvider } from './base.js';

export class MistralProvider extends BaseProvider {
  constructor() {
    super('mistral', 'Mistral AI (Codestral Free Tier)');
    this.baseUrl = 'https://api.mistral.ai/v1';

    this.freeModels = [
      { id: 'codestral-latest', name: 'Codestral Latest', context: 32768, caps: 'chat,code' },
      { id: 'mistral-small-latest', name: 'Mistral Small Latest', context: 32768, caps: 'chat,code' },
      { id: 'open-mistral-nemo', name: 'Mistral Nemo (12B)', context: 128000, caps: 'chat' }
    ];
  }

  async scanModels(apiKey) {
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

  async complete({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModelId = model.replace(/^mistral\//, '');
    const body = {
      model: rawModelId,
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
