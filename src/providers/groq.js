import { BaseProvider } from './base.js';

export class GroqProvider extends BaseProvider {
  constructor() {
    super('groq', 'Groq LPU (Ultra-Fast Free)');
    this.baseUrl = 'https://api.groq.com/openai/v1';

    this.freeModels = [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', context: 128000, caps: 'chat,code' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', context: 128000, caps: 'chat,fast' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B', context: 128000, caps: 'chat,reasoning' },
      { id: 'qwen-2.5-32b', name: 'Qwen 2.5 32B Instruct', context: 128000, caps: 'chat,code' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', context: 8192, caps: 'chat,fast' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B 32k', context: 32768, caps: 'chat' }
    ];
  }

  async scanModels(apiKey) {
    if (apiKey) {
      try {
        const res = await fetch(`${this.baseUrl}/models`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data && Array.isArray(data.data)) {
            // Match models that exist in Groq's active list
            const activeIds = new Set(data.data.map(m => m.id));
            const available = this.freeModels.filter(m => activeIds.has(m.id));
            if (available.length > 0) {
              return available.map(m => this.formatModel(m));
            }
          }
        }
      } catch (e) {
        console.warn(`[Groq] Live scan warning: ${e.message}`);
      }
    }

    return this.freeModels.map(m => this.formatModel(m));
  }

  formatModel(m) {
    return {
      id: `groq/${m.id}`,
      provider: 'groq',
      model_id: m.id,
      display_name: `${m.name} [Groq LPU Free]`,
      description: 'Groq Ultra-Fast LPU Free Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    };
  }

  async complete({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModelId = model.replace(/^groq\//, '');
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
      const err = new Error(`Groq API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
