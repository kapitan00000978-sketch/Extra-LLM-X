import { BaseAdapter } from './base.js';

export class ChutesAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'chutes',
      name: 'Chutes AI',
      badge: 'Decentralized Serverless',
      getKeyUrl: 'https://chutes.ai/',
      guide: 'Sign up on Chutes AI, grab API token under developer account settings.',
      freeTierInfo: 'Free serverless access to open weights AI models',
      popularModels: 'deepseek-ai/DeepSeek-V3, deepseek-ai/DeepSeek-R1',
      keyPrefix: '',
      keyPlaceholder: 'chutes_xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://llm.chutes.ai/v1';
    this.freeModels = [
      { id: 'deepseek-ai/DeepSeek-V3', name: 'Chutes DeepSeek V3', context: 65536, caps: 'chat,code' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'Chutes DeepSeek R1', context: 65536, caps: 'chat,code,reasoning' },
      { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Chutes Llama 3.3 70B', context: 128000, caps: 'chat,code' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `chutes/${m.id}`,
      provider: 'chutes',
      model_id: m.id,
      display_name: `${m.name} [Chutes Free]`,
      description: 'Chutes AI Serverless High-Throughput Open Source Models',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^chutes\//, '');
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
      const err = new Error(`Chutes API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
