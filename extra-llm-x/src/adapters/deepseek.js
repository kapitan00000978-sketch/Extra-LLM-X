import { BaseAdapter } from './base.js';

export class DeepSeekAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'deepseek',
      name: 'DeepSeek Official',
      badge: 'V3 & R1 Reasoning',
      getKeyUrl: 'https://platform.deepseek.com/api_keys',
      guide: 'Sign up on DeepSeek Platform, get 5,000,000 free tokens on signup, create API key.',
      freeTierInfo: '5M Free Tokens on Signup for DeepSeek-V3 & R1',
      popularModels: 'deepseek-chat, deepseek-reasoner',
      keyPrefix: 'sk-',
      keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.deepseek.com/v1';
    this.freeModels = [
      { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)', context: 65536, caps: 'chat,code,fast' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)', context: 65536, caps: 'chat,code,reasoning' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `deepseek/${m.id}`,
      provider: 'deepseek',
      model_id: m.id,
      display_name: `${m.name} [DeepSeek 5M Free]`,
      description: 'DeepSeek State-of-the-Art Open Weights V3 & R1 Reasoning Models',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^deepseek\//, '');
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
      const err = new Error(`DeepSeek API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
