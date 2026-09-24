import { BaseAdapter } from './base.js';

export class ZhipuAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'zhipu',
      name: 'Zhipu AI (GLM-4)',
      badge: 'GLM-4-Flash Free Forever',
      getKeyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
      guide: 'Register on BigModel (Zhipu AI), GLM-4-Flash is 100% free forever for all developers.',
      freeTierInfo: 'GLM-4-Flash: Completely free forever, 128k context',
      popularModels: 'glm-4-flash',
      keyPrefix: '',
      keyPlaceholder: 'Paste Zhipu AI API Key'
    });
    this.baseUrl = 'https://open.bigmodel.cn/api/paas/v4';
    this.freeModels = [
      { id: 'glm-4-flash', name: 'Zhipu GLM-4 Flash', context: 131072, caps: 'chat,code,fast' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `zhipu/${m.id}`,
      provider: 'zhipu',
      model_id: m.id,
      display_name: `${m.name} [100% Free Forever]`,
      description: 'Zhipu AI GLM-4-Flash Permanent Free Tier Model',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^zhipu\//, '');
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
      const err = new Error(`Zhipu API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
