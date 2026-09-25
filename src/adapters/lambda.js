import { BaseAdapter } from './base.js';

export class LambdaAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'lambda',
      name: 'Lambda Labs (GPU Inference Cloud)',
      badge: 'High-Throughput GPU',
      getKeyUrl: 'https://cloud.lambdalabs.com/api-keys',
      guide: 'Sign up on Lambda Labs to deploy low-cost, ultra-high-speed open-source model inference.',
      freeTierInfo: 'Developer pay-per-token GPU cloud',
      popularModels: 'hermes-3-llama-3.1-405b, llama3.1-70b-instruct-fp8',
      keyPrefix: 'secret_',
      keyPlaceholder: 'secret_...'
    });
    this.baseUrl = 'https://api.lambdalabs.com/v1';
    this.freeModels = [
      { id: 'hermes-3-llama-3.1-405b', name: 'Lambda Hermes 3 405B', context: 131072, caps: 'chat,reasoning,code' },
      { id: 'llama3.1-70b-instruct-fp8', name: 'Lambda Llama 3.1 70B FP8', context: 131072, caps: 'chat,fast,code' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `lambda/${m.id}`,
      provider: 'lambda',
      model_id: m.id,
      display_name: `${m.name} [Lambda GPU]`,
      description: 'Lambda Labs GPU Inference API',
      context_window: m.context,
      is_free: 0,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    if (!apiKey) {
      const err = new Error('Lambda Labs API key is required');
      err.status = 401;
      throw err;
    }
    const rawModel = model.replace(/^lambda\//, '');
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
      signal: AbortSignal.timeout(30000)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Lambda API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
