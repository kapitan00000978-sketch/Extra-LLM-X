import { BaseAdapter } from './base.js';

export class FriendliAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'friendli',
      name: 'Friendli AI Serverless',
      badge: 'Ultra Low TTFT',
      getKeyUrl: 'https://suite.friendli.ai/settings/tokens',
      guide: 'Generate personal access token on Friendli Suite dashboard for serverless inference.',
      freeTierInfo: '$5.00 free compute credits for new developers',
      popularModels: 'meta-llama-3.1-70b-instruct, deepseek-v3, mistral-7b-instruct-v0.3',
      keyPrefix: 'flp_',
      keyPlaceholder: 'flp_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.friendli.ai/serverless/v1';
    this.freeModels = [
      {
            "id": "meta-llama-3.1-70b-instruct",
            "name": "Friendli Llama 3.1 70B",
            "context": 128000,
            "caps": "chat,code"
      },
      {
            "id": "deepseek-v3",
            "name": "Friendli DeepSeek V3",
            "context": 64000,
            "caps": "chat,reasoning"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `friendli/${m.id}`,
      provider: 'friendli',
      model_id: m.id,
      display_name: `${m.name} [Friendli AI Serverless]`,
      description: 'Friendli AI Serverless Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^friendli\//, '');
    const body = { 
      model: rawModel, 
      messages, 
      stream, 
      ...(temperature !== undefined ? { temperature } : {}), 
      ...(max_tokens !== undefined ? { max_tokens } : {}),
      ...(tools?.length ? { tools, tool_choice } : {}) 
    };

    let targetUrl = `${this.baseUrl}/chat/completions`;
    

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Friendli AI Serverless API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
