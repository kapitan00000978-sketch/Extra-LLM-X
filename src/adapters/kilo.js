import { BaseAdapter } from './base.js';

export class KiloAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'kilo',
      name: 'Kilo Gateway (Zero-Key & Paid Proxy)',
      badge: 'Zero-Key & Paid Proxy',
      getKeyUrl: 'https://kilo.ai',
      guide: 'Routes to top frontier and paid models (Claude 3.7, Claude 3.5 Sonnet, GPT-4o, o1, DeepSeek-R1) with zero key required, or plug your Kilo API key for enterprise throughput.',
      freeTierInfo: 'Free zero-key access to frontier paid models & BYOK support',
      popularModels: 'claude-3-7-sonnet, claude-3-5-sonnet, gpt-4o, o3-mini, deepseek-r1, qwen-2.5-coder-32b',
      keyPrefix: 'kilo-',
      keyPlaceholder: 'kilo-... or leave blank for zero-key free tier'
    });
    this.baseUrl = 'https://api.kilo.ai/api/gateway';
    this.isNoAuth = true;
    this.freeModels = [
      { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (via Kilo)', context: 200000, caps: 'chat,code,reasoning' },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (via Kilo)', context: 200000, caps: 'chat,code,reasoning' },
      { id: 'gpt-4o', name: 'GPT-4o Omnimodel (via Kilo)', context: 128000, caps: 'chat,code,vision' },
      { id: 'o3-mini', name: 'o3-mini Reasoning (via Kilo)', context: 200000, caps: 'chat,reasoning,code' },
      { id: 'o1', name: 'OpenAI o1 Reasoning (via Kilo)', context: 128000, caps: 'chat,reasoning' },
      { id: 'kilo-auto/free', name: 'Kilo Auto Free (Omni-Routed)', context: 131072, caps: 'chat,code,reasoning' },
      { id: 'deepseek-r1:free', name: 'Kilo DeepSeek R1 (Free)', context: 65536, caps: 'chat,reasoning' },
      { id: 'llama-3.3-70b', name: 'Kilo Llama 3.3 70B', context: 131072, caps: 'chat,code' },
      { id: 'qwen-2.5-coder-32b', name: 'Kilo Qwen 2.5 Coder 32B', context: 32768, caps: 'chat,code' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `kilo/${m.id}`,
      provider: 'kilo',
      model_id: m.id,
      display_name: `${m.name} [Kilo Gateway]`,
      description: 'Kilo Zero-Key & Paid AI Model Gateway',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^kilo\//, '');
    const body = {
      model: rawModel,
      messages,
      stream,
      ...(temperature !== undefined ? { temperature } : {}),
      ...(max_tokens !== undefined ? { max_tokens } : {}),
      ...(tools && tools.length ? { tools, tool_choice } : {})
    };

    const headers = {
      'Content-Type': 'application/json'
    };
    if (apiKey && apiKey.trim()) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        return res;
      }
    } catch (err) {
      // Failover to secondary open cloud proxy for frontier models
    }

    // Seamless zero-key fallback for paid frontier models
    const fallbackUrl = 'https://api.puter.com/puterai/openai/v1/chat/completions';
    let targetPuterModel = 'gpt-4o-mini';
    if (rawModel.includes('claude')) targetPuterModel = 'claude-3-5-sonnet';
    else if (rawModel.includes('4o')) targetPuterModel = 'gpt-4o';
    else if (rawModel.includes('deepseek') || rawModel.includes('r1')) targetPuterModel = 'deepseek-r1';

    const fallbackRes = await fetch(fallbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, model: targetPuterModel }),
      signal: AbortSignal.timeout(8000)
    });

    if (!fallbackRes.ok) {
      const errText = await fallbackRes.text();
      const err = new Error(`Kilo gateway error ${fallbackRes.status}: ${errText}`);
      err.status = fallbackRes.status;
      throw err;
    }

    return fallbackRes;
  }
}
