import { BaseProvider } from './base.js';

export class OllamaProvider extends BaseProvider {
  constructor() {
    super('ollama', 'Ollama (100% Free Local AI)');
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  async scanModels(apiKey) {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models)) {
          return data.models.map(m => ({
            id: `ollama/${m.name}`,
            provider: 'ollama',
            model_id: m.name,
            display_name: `${m.name} [Local Ollama 100% Free]`,
            description: `Local model (${Math.round((m.size || 0) / (1024 * 1024 * 1024) * 10) / 10} GB)`,
            context_window: 32768,
            is_free: 1,
            capabilities: m.name.includes('code') ? 'chat,code' : (m.name.includes('r1') ? 'chat,reasoning' : 'chat')
          }));
        }
      }
    } catch (e) {
      // Ollama not running locally right now, that's normal
    }
    return [];
  }

  async complete({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModelId = model.replace(/^ollama\//, '');
    const body = {
      model: rawModelId,
      messages,
      stream,
      temperature,
      max_tokens,
      ...(tools && tools.length ? { tools, tool_choice } : {})
    };

    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Ollama error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
