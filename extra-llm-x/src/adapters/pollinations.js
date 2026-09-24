import { BaseAdapter } from './base.js';

export class PollinationsAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'pollinations',
      name: 'Pollinations AI (NoAuth)',
      badge: 'Zero-Key Public Endpoint',
      getKeyUrl: 'https://pollinations.ai',
      guide: 'No API key needed! Connects directly to Pollinations public free OpenAI endpoint.',
      freeTierInfo: '100% Free Public Endpoint for Open Models',
      popularModels: 'openai, qwen, mistral',
      keyPrefix: '',
      keyPlaceholder: 'No key required'
    });
    this.baseUrl = 'https://text.pollinations.ai/openai';
    this.isNoAuth = true;
    this.freeModels = [
      { id: 'openai', name: 'Pollinations GPT-4o-Mini', context: 128000, caps: 'chat,fast' },
      { id: 'qwen', name: 'Pollinations Qwen 2.5 72B', context: 32768, caps: 'chat,code' },
      { id: 'mistral', name: 'Pollinations Mistral Nemo', context: 32768, caps: 'chat,code' },
      { id: 'deepseek', name: 'Pollinations DeepSeek V3', context: 65536, caps: 'chat,code,reasoning' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `pollinations/${m.id}`,
      provider: 'pollinations',
      model_id: m.id,
      display_name: `${m.name} [Pollinations Free]`,
      description: 'Pollinations Free Public AI Inference Endpoint',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    let rawModel = model.replace(/^pollinations\//, '');
    if (rawModel !== 'openai' && rawModel !== 'mistral') {
      rawModel = 'openai';
    }
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Pollinations API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
