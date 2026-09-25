import { BaseAdapter } from './base.js';

export class HunyuanAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'hunyuan',
      name: 'Tencent Hunyuan (Flagship LLM)',
      badge: 'Tencent Flagship',
      getKeyUrl: 'https://cloud.tencent.com/product/hunyuan',
      guide: 'Sign up on Tencent Cloud console to obtain Hunyuan API credentials.',
      freeTierInfo: 'Free 100,000 token test quota for new accounts',
      popularModels: 'hunyuan-large, hunyuan-standard, hunyuan-code',
      keyPrefix: 'sk-',
      keyPlaceholder: 'sk-...'
    });
    this.baseUrl = 'https://api.hunyuan.cloud.tencent.com/v1';
    this.freeModels = [
      { id: 'hunyuan-large', name: 'Tencent Hunyuan Large', context: 32768, caps: 'chat,reasoning,code' },
      { id: 'hunyuan-standard', name: 'Tencent Hunyuan Standard', context: 32768, caps: 'chat,fast' },
      { id: 'hunyuan-code', name: 'Tencent Hunyuan Code', context: 32768, caps: 'chat,code' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `hunyuan/${m.id}`,
      provider: 'hunyuan',
      model_id: m.id,
      display_name: `${m.name} [Tencent Hunyuan]`,
      description: 'Tencent Hunyuan Multimodal & Reasoning Model',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    if (!apiKey) {
      const err = new Error('Tencent Hunyuan API key is required');
      err.status = 401;
      throw err;
    }
    const rawModel = model.replace(/^hunyuan\//, '');
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
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Hunyuan API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
