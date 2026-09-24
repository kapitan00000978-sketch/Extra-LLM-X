import { BaseAdapter } from './base.js';

export class OpenCodeAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'opencode',
      name: 'OpenCode Free (NoAuth)',
      badge: 'Zero-Key Public Endpoint',
      getKeyUrl: 'https://opencode.ai',
      guide: 'No API key needed! Connects directly to OpenCode public free inference endpoint.',
      freeTierInfo: '100% Free Public Endpoint for Kimi, GLM, Qwen, and DeepSeek',
      popularModels: 'deepseek-v3, glm-4, qwen-2.5-72b, kimi-k2.5',
      keyPrefix: '',
      keyPlaceholder: 'No key required'
    });
    this.baseUrl = 'https://opencode.ai/zen/v1';
    this.freeModels = [
      { id: 'deepseek-v3', name: 'OpenCode DeepSeek V3', context: 65536, caps: 'chat,code' },
      { id: 'glm-4', name: 'OpenCode GLM-4', context: 128000, caps: 'chat,code' },
      { id: 'qwen-2.5-72b', name: 'OpenCode Qwen 2.5 72B', context: 32768, caps: 'chat,code' },
      { id: 'kimi-k2.5', name: 'OpenCode Kimi K2.5', context: 65536, caps: 'chat,reasoning' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `opencode/${m.id}`,
      provider: 'opencode',
      model_id: m.id,
      display_name: `${m.name} [No-Auth Free]`,
      description: 'OpenCode Free Public AI Gateway Endpoint (No Key Needed)',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^opencode\//, '');
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`OpenCode API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
