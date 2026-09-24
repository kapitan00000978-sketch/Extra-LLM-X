import { BaseAdapter } from './base.js';

export class GroqAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'groq',
      name: 'Groq Cloud',
      badge: 'Ultra-Fast LPU',
      getKeyUrl: 'https://console.groq.com/keys',
      guide: 'Sign up with Google/GitHub, create API key, instant 500+ tok/s free.',
      freeTierInfo: '30 req/min, 14,400 req/day free forever',
      popularModels: 'llama-3.3-70b-versatile, deepseek-r1-distill-llama-70b',
      keyPrefix: 'gsk_',
      keyPlaceholder: 'gsk_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
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

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `groq/${m.id}`,
      provider: 'groq',
      model_id: m.id,
      display_name: `${m.name} [Groq LPU Free]`,
      description: 'Groq Ultra-Fast LPU Free Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^groq\//, '');
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
      const err = new Error(`Groq API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
