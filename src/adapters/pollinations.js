import { BaseAdapter } from './base.js';

export class PollinationsAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'pollinations',
      name: 'Pollinations AI (Zero-Key Public Gateway)',
      badge: 'Zero-Key Public Endpoint',
      getKeyUrl: 'https://pollinations.ai',
      guide: 'No API key needed! Connects directly to Pollinations public free OpenAI & Claude endpoint.',
      freeTierInfo: '100% Free Public Endpoint for Claude, OpenAI, and DeepSeek Models',
      popularModels: 'openai, claude, deepseek, qwen, mistral',
      keyPrefix: '',
      keyPlaceholder: 'No key required'
    });
    this.baseUrl = 'https://text.pollinations.ai/openai';
    this.isNoAuth = true;
    this.freeModels = [
      { id: 'openai', name: 'Pollinations GPT-4o-Mini', context: 128000, caps: 'chat,fast' },
      { id: 'claude', name: 'Pollinations Claude 3.5/3.7', context: 200000, caps: 'chat,code,reasoning' },
      { id: 'deepseek', name: 'Pollinations DeepSeek R1/V3', context: 65536, caps: 'chat,code,reasoning' },
      { id: 'qwen', name: 'Pollinations Qwen 2.5 72B', context: 32768, caps: 'chat,code' },
      { id: 'mistral', name: 'Pollinations Mistral Nemo', context: 32768, caps: 'chat,code' }
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
    const allowed = ['openai', 'claude', 'deepseek', 'qwen', 'mistral'];
    if (!allowed.includes(rawModel)) {
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
      signal: AbortSignal.timeout(10000)
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
