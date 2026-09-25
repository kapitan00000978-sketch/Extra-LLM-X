import { BaseAdapter } from './base.js';

export class MonsterApiAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'monsterapi',
      name: 'MonsterAPI (Serverless Cloud)',
      badge: 'Monster Serverless',
      getKeyUrl: 'https://monsterapi.ai/signup',
      guide: 'Sign up on MonsterAPI for serverless LLM deployment and API endpoints.',
      freeTierInfo: 'Free credits on signup',
      popularModels: 'meta-llama/Meta-Llama-3.3-70B-Instruct, mistralai/Mistral-7B-Instruct-v0.2',
      keyPrefix: '',
      keyPlaceholder: 'Paste MonsterAPI Key'
    });
    this.baseUrl = 'https://api.monsterapi.ai/v1';
    this.freeModels = [
      { id: 'meta-llama/Meta-Llama-3.3-70B-Instruct', name: 'MonsterAPI Llama 3.3 70B', context: 131072, caps: 'chat,code' },
      { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'MonsterAPI Mistral 7B', context: 32768, caps: 'chat,fast' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `monsterapi/${m.id}`,
      provider: 'monsterapi',
      model_id: m.id,
      display_name: `${m.name} [MonsterAPI]`,
      description: 'MonsterAPI Serverless AI',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    if (!apiKey) {
      const err = new Error('MonsterAPI key is required');
      err.status = 401;
      throw err;
    }
    const rawModel = model.replace(/^monsterapi\//, '');
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
      const err = new Error(`MonsterAPI error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
