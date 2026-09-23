import { BaseAdapter } from './base.js';

export class CloudflareAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'cloudflare',
      name: 'Cloudflare Workers AI',
      badge: '10,000 Neurons/Day',
      getKeyUrl: 'https://dash.cloudflare.com/profile/api-tokens',
      guide: 'Create an API Token with Workers AI (Read) permissions in Cloudflare dashboard.',
      freeTierInfo: '10,000 Neurons free every single day',
      popularModels: '@cf/meta/llama-3.3-70b-instruct, @cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
      keyPrefix: '',
      keyPlaceholder: 'Format: API_TOKEN:ACCOUNT_ID'
    });
    this.freeModels = [
      { id: '@cf/meta/llama-3.3-70b-instruct', name: 'CF Llama 3.3 70B', context: 128000, caps: 'chat,code' },
      { id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', name: 'CF DeepSeek R1 32B', context: 32768, caps: 'chat,reasoning' },
      { id: '@cf/meta/llama-3.1-8b-instruct', name: 'CF Llama 3.1 8B', context: 128000, caps: 'chat,fast' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `cloudflare/${m.id}`,
      provider: 'cloudflare',
      model_id: m.id,
      display_name: `${m.name} [Cloudflare Free]`,
      description: 'Cloudflare Workers AI 10k Free Neurons/Day',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^cloudflare\//, '');
    let token = apiKey;
    let accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';

    // Support combined key format "TOKEN:ACCOUNT_ID"
    if (apiKey.includes(':')) {
      const parts = apiKey.split(':');
      token = parts[0];
      accountId = parts[1];
    }

    if (!accountId) {
      throw new Error('Cloudflare requires account ID. Provide key as "API_TOKEN:ACCOUNT_ID"');
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;
    const body = {
      model: rawModel,
      messages,
      stream,
      temperature,
      max_tokens,
      ...(tools && tools.length ? { tools, tool_choice } : {})
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Cloudflare AI error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
