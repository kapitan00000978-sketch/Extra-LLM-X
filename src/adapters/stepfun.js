import { BaseAdapter } from './base.js';

export class StepFunAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'stepfun',
      name: 'StepFun (Jieyue)',
      badge: 'Multimodal CoT',
      getKeyUrl: 'https://platform.stepfun.com/interface-key',
      guide: 'Create StepFun API token on the developer portal for Step-1 and Step-2 models.',
      freeTierInfo: 'Free trial tokens upon registration',
      popularModels: 'step-1-8k, step-1-32k, step-2-16k',
      keyPrefix: 'sk-',
      keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://api.stepfun.com/v1';
    this.freeModels = [
      {
            "id": "step-1-8k",
            "name": "Step-1 8K",
            "context": 8192,
            "caps": "chat,fast"
      },
      {
            "id": "step-1-32k",
            "name": "Step-1 32K",
            "context": 32768,
            "caps": "chat,long-context"
      },
      {
            "id": "step-2-16k",
            "name": "Step-2 16K Reasoning",
            "context": 16384,
            "caps": "chat,reasoning"
      }
];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `stepfun/${m.id}`,
      provider: 'stepfun',
      model_id: m.id,
      display_name: `${m.name} [StepFun (Jieyue)]`,
      description: 'StepFun (Jieyue) Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^stepfun\//, '');
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
      const err = new Error(`StepFun (Jieyue) API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
