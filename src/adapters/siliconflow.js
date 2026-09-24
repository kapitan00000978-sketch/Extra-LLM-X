import { BaseAdapter } from './base.js';

export class SiliconFlowAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'siliconflow',
      name: 'SiliconFlow',
      badge: 'Permanent Free Tier',
      getKeyUrl: 'https://cloud.siliconflow.cn/account/ak',
      guide: 'Register on SiliconFlow to get permanently free access to Qwen 2.5 and DeepSeek R1 7B.',
      freeTierInfo: 'Permanently free tier for select open-source models',
      popularModels: 'Qwen/Qwen2.5-7B-Instruct, deepseek-ai/DeepSeek-R1-Distill-Qwen-7B, THUDM/glm-4-9b-chat',
      keyPrefix: 'sk-',
      keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.siliconflow.cn/v1';
    this.freeModels = [
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'SiliconFlow Qwen 2.5 7B', context: 32768, caps: 'chat,code,fast' },
      { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', name: 'SiliconFlow DeepSeek R1 7B', context: 32768, caps: 'chat,reasoning' },
      { id: 'THUDM/glm-4-9b-chat', name: 'SiliconFlow GLM-4 9B', context: 32768, caps: 'chat' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `siliconflow/${m.id}`,
      provider: 'siliconflow',
      model_id: m.id,
      display_name: `${m.name} [SiliconFlow Free]`,
      description: 'SiliconFlow Permanent Free Tier Model',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^siliconflow\//, '');
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
      const err = new Error(`SiliconFlow API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
