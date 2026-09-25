import { BaseAdapter } from './base.js';

export class MiniMaxAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'minimax',
      name: 'MiniMax',
      badge: 'MoE Architecture',
      getKeyUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
      guide: 'Register on MiniMax platform and generate standard Bearer API key.',
      freeTierInfo: 'Free trial starter credits on registration',
      popularModels: 'abab6.5s-chat, abab6.5t-chat, MiniMax-Text-01',
      keyPrefix: 'sk-',
      keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.minimax.chat/v1';
    this.freeModels = [
      {
            "id": "abab6.5s-chat",
            "name": "MiniMax abab 6.5s",
            "context": 245760,
            "caps": "chat,fast"
      },
      {
            "id": "MiniMax-Text-01",
            "name": "MiniMax-Text-01 MoE",
            "context": 1000000,
            "caps": "chat,long-context,reasoning"
      },
      {
            "id": "abab6.5t-chat",
            "name": "MiniMax abab 6.5t",
            "context": 245760,
            "caps": "chat,code"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `minimax/${m.id}`,
      provider: 'minimax',
      model_id: m.id,
      display_name: `${m.name} [MiniMax]`,
      description: 'MiniMax Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^minimax\//, '');
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
      const err = new Error(`MiniMax API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
