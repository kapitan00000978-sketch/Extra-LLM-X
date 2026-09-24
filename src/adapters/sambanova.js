import { BaseAdapter } from './base.js';

export class SambaNovaAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'sambanova',
      name: 'SambaNova Cloud',
      badge: 'SN40L High-Speed',
      getKeyUrl: 'https://cloud.sambanova.ai/apis',
      guide: 'Register on SambaNova Cloud, navigate to APIs -> Create Key.',
      freeTierInfo: 'Generous free developer tier',
      popularModels: 'Meta-Llama-3.3-70B-Instruct, DeepSeek-R1',
      keyPrefix: '',
      keyPlaceholder: 'Paste SambaNova API Key'
    });
    this.baseUrl = 'https://api.sambanova.ai/v1';
    this.freeModels = [
      { id: 'Meta-Llama-3.3-70B-Instruct', name: 'SambaNova Llama 3.3 70B', context: 131072, caps: 'chat,code' },
      { id: 'DeepSeek-R1', name: 'SambaNova DeepSeek R1', context: 64000, caps: 'chat,reasoning' },
      { id: 'Qwen2.5-Coder-32B-Instruct', name: 'SambaNova Qwen 2.5 Coder 32B', context: 32768, caps: 'chat,code' },
      { id: 'Meta-Llama-3.1-405B-Instruct', name: 'SambaNova Llama 3.1 405B', context: 16384, caps: 'chat,reasoning' },
      { id: 'Meta-Llama-3.1-8B-Instruct', name: 'SambaNova Llama 3.1 8B', context: 16384, caps: 'chat,fast' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `sambanova/${m.id}`,
      provider: 'sambanova',
      model_id: m.id,
      display_name: `${m.name} [SambaNova Free]`,
      description: 'SambaNova Cloud High-Speed Free Developer Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^sambanova\//, '');
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
      const err = new Error(`SambaNova API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
