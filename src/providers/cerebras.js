import { BaseProvider } from './base.js';

export class CerebrasProvider extends BaseProvider {
  constructor() {
    super('cerebras', 'Cerebras Cloud (2,000+ tok/s Free)');
    this.baseUrl = 'https://api.cerebras.ai/v1';

    this.freeModels = [
      { id: 'llama-3.3-70b', name: 'Cerebras Llama 3.3 70B', context: 128000, caps: 'chat,code,fast' },
      { id: 'llama3.1-8b', name: 'Cerebras Llama 3.1 8B', context: 8192, caps: 'chat,fast' }
    ];
  }

  async scanModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `cerebras/${m.id}`,
      provider: 'cerebras',
      model_id: m.id,
      display_name: `${m.name} [Cerebras 2000 tok/s]`,
      description: 'Cerebras Ultra-High-Speed CS-3 Wafer Scale Free Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async complete({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModelId = model.replace(/^cerebras\//, '');
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
      const err = new Error(`Cerebras API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
