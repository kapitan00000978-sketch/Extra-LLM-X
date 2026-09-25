import { BaseAdapter } from './base.js';

export class RunPodAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'runpod',
      name: 'RunPod Serverless (vLLM Cloud)',
      badge: 'Serverless GPU Cloud',
      getKeyUrl: 'https://www.runpod.io/console/serverless',
      guide: 'Deploy or connect to serverless vLLM worker endpoints on RunPod.',
      freeTierInfo: 'BYOK Serverless GPU Pay-Per-Second',
      popularModels: 'meta-llama/Llama-3.3-70B-Instruct, deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
      keyPrefix: 'rpa_',
      keyPlaceholder: 'rpa_...'
    });
    this.baseUrl = 'https://api.runpod.ai/v2';
    this.freeModels = [
      { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'RunPod Llama 3.3 70B', context: 131072, caps: 'chat,code' },
      { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', name: 'RunPod DeepSeek R1 32B', context: 65536, caps: 'chat,reasoning' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `runpod/${m.id}`,
      provider: 'runpod',
      model_id: m.id,
      display_name: `${m.name} [RunPod Serverless]`,
      description: 'RunPod Serverless vLLM Endpoint',
      context_window: m.context,
      is_free: 0,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    if (!apiKey) {
      const err = new Error('RunPod API key is required. Get one at runpod.io');
      err.status = 401;
      throw err;
    }
    const rawModel = model.replace(/^runpod\//, '');
    const body = {
      model: rawModel,
      messages,
      stream,
      temperature,
      max_tokens,
      ...(tools && tools.length ? { tools, tool_choice } : {})
    };

    const res = await fetch('https://api.runpod.ai/v2/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`RunPod API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
