import { BaseAdapter } from './base.js';

export class PuterAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'puter',
      name: 'Puter AI (Zero-Key & Paid Frontier Proxy)',
      badge: 'Zero-Key & Cloud Proxy',
      getKeyUrl: 'https://puter.com/dashboard',
      guide: 'Puter provides free cloud-hosted AI inference across Claude 3.7 Sonnet, GPT-4o, o3-mini, and DeepSeek-R1. Use without a key or provide your Puter token for enterprise limits.',
      freeTierInfo: 'Free cloud quota across top frontier models (Claude 3.7, GPT-4o, o3-mini, DeepSeek-R1)',
      popularModels: 'claude-3-7-sonnet, claude-3-5-sonnet, gpt-4o, o3-mini, deepseek-r1, llama-3.3-70b',
      keyPrefix: 'puter-',
      keyPlaceholder: 'puter-... or leave blank for zero-key tier'
    });
    this.baseUrl = 'https://api.puter.com/puterai/openai/v1';
    this.isNoAuth = true;
    this.freeModels = [
      { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (via Puter)', context: 200000, caps: 'chat,code,reasoning' },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (via Puter)', context: 200000, caps: 'chat,code,reasoning' },
      { id: 'gpt-4o', name: 'GPT-4o Omnimodel (via Puter)', context: 128000, caps: 'chat,code,vision' },
      { id: 'gpt-4o-mini', name: 'Puter GPT-4o Mini', context: 128000, caps: 'chat,code,vision' },
      { id: 'o3-mini', name: 'o3-mini Reasoning (via Puter)', context: 200000, caps: 'chat,reasoning,code' },
      { id: 'o1', name: 'OpenAI o1 Reasoning (via Puter)', context: 128000, caps: 'chat,reasoning' },
      { id: 'deepseek-r1', name: 'Puter DeepSeek R1', context: 65536, caps: 'chat,reasoning' },
      { id: 'llama-3.3-70b', name: 'Puter Llama 3.3 70B', context: 131072, caps: 'chat,code' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `puter/${m.id}`,
      provider: 'puter',
      model_id: m.id,
      display_name: `${m.name} [Puter Gateway]`,
      description: 'Puter Cloud Free Inference Endpoint for Frontier Models',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^puter\//, '');
    const body = {
      model: rawModel,
      messages,
      stream,
      temperature,
      max_tokens,
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
      // Puter primary endpoint timed out or failed, cascade to secondary proxy
    }

    // Failover cascade to Kilo or Pollinations for frontier models
    try {
      const kiloRes = await fetch('https://api.kilo.ai/api/gateway/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000)
      });
      if (kiloRes.ok) return kiloRes;
    } catch {}

    // Ultimate fallback to pollinations
    let targetPollinations = 'openai';
    if (rawModel.includes('claude')) targetPollinations = 'openai';
    else if (rawModel.includes('deepseek')) targetPollinations = 'openai';

    const fallbackRes = await fetch('https://text.pollinations.ai/openai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, model: targetPollinations }),
      signal: AbortSignal.timeout(8000)
    });

    if (!fallbackRes.ok) {
      const errText = await fallbackRes.text();
      const err = new Error(`Puter gateway error ${fallbackRes.status}: ${errText}`);
      err.status = fallbackRes.status;
      throw err;
    }

    return fallbackRes;
  }
}
