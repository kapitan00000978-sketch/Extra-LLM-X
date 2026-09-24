import { BaseAdapter } from './base.js';

export class OllamaAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'ollama',
      name: 'Local Ollama',
      badge: '100% Free & Offline',
      getKeyUrl: 'https://ollama.com/',
      guide: 'Install Ollama, run any model (e.g. ollama run llama3), auto-detected on localhost:11434.',
      freeTierInfo: 'Unlimited, 100% private on your own GPU/CPU',
      popularModels: 'llama3.3, deepseek-r1, qwen2.5-coder',
      keyPrefix: '',
      keyPlaceholder: 'No key needed (Localhost)'
    });
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  async discoverModels(apiKey) {
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
            display_name: `${m.name} [Local Ollama]`,
            description: `Local model (${Math.round((m.size || 0) / (1024 * 1024 * 1024) * 10) / 10} GB)`,
            context_window: 32768,
            is_free: 1,
            capabilities: m.name.includes('code') ? 'chat,code' : (m.name.includes('r1') ? 'chat,reasoning' : 'chat')
          }));
        }
      }
    } catch {
      // Ollama not currently active locally
    }
    return [];
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^ollama\//, '');
    const body = {
      model: rawModel,
      messages,
      stream,
      temperature,
      max_tokens,
      ...(tools && tools.length ? { tools, tool_choice } : {})
    };

    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
