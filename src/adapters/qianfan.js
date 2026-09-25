import { BaseAdapter } from './base.js';

export class QianfanAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'qianfan',
      name: 'Baidu Qianfan (ERNIE)',
      badge: 'ERNIE Speed Free',
      getKeyUrl: 'https://console.bce.baidu.com/qianfan/ais/console/onlineService',
      guide: 'Obtain Qianfan API Key on Baidu AI Cloud Console.',
      freeTierInfo: 'ERNIE-Speed-8K and ERNIE-Lite are permanently free',
      popularModels: 'ernie-speed-8k, ernie-lite-8k, ernie-4.0-turbo-8k',
      keyPrefix: 'bce-v3/',
      keyPlaceholder: 'bce-v3/ALTAK-xxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://qianfan.baidubce.com/v2';
    this.freeModels = [
      {
            "id": "ernie-speed-8k",
            "name": "ERNIE Speed 8K (Free)",
            "context": 8192,
            "caps": "chat,fast"
      },
      {
            "id": "ernie-lite-8k",
            "name": "ERNIE Lite 8K (Free)",
            "context": 8192,
            "caps": "chat,fast"
      },
      {
            "id": "ernie-4.0-turbo-8k",
            "name": "ERNIE 4.0 Turbo",
            "context": 8192,
            "caps": "chat,reasoning"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `qianfan/${m.id}`,
      provider: 'qianfan',
      model_id: m.id,
      display_name: `${m.name} [Baidu Qianfan (ERNIE)]`,
      description: 'Baidu Qianfan (ERNIE) Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^qianfan\//, '');
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
      const err = new Error(`Baidu Qianfan (ERNIE) API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
