import { BaseAdapter } from './base.js';

export class DuckDuckGoAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'duckduckgo',
      name: 'DuckDuckGo AI (Zero-Key Privacy Proxy)',
      badge: 'Zero-Key & Privacy Proxy',
      getKeyUrl: 'https://duckduckgo.com/aichat',
      guide: 'No API key needed! Connects directly to DuckDuckGo anonymous privacy-shielded chat gateway for Claude, GPT-4o-mini, and Llama 3.3.',
      freeTierInfo: '100% Free Anonymous Privacy AI Tier',
      popularModels: 'gpt-4o-mini, claude-3-haiku, llama-3.3-70b, mixtral-8x7b',
      keyPrefix: '',
      keyPlaceholder: 'No key required (Zero-Key Privacy)'
    });
    this.baseUrl = 'https://duckduckgo.com/duckchat/v1';
    this.isNoAuth = true;
    this.freeModels = [
      { id: 'gpt-4o-mini', name: 'DuckDuckGo GPT-4o Mini', context: 128000, caps: 'chat,fast,privacy' },
      { id: 'claude-3-haiku-20240307', name: 'DuckDuckGo Claude 3 Haiku', context: 200000, caps: 'chat,fast,privacy' },
      { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'DuckDuckGo Llama 3.3 70B', context: 131072, caps: 'chat,code,privacy' },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'DuckDuckGo Mixtral 8x7B', context: 32768, caps: 'chat,privacy' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `duckduckgo/${m.id}`,
      provider: 'duckduckgo',
      model_id: m.id,
      display_name: `${m.name} [DDG Privacy Gateway]`,
      description: 'DuckDuckGo Privacy-Shielded AI Proxy',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^duckduckgo\//, '');
    const body = {
      model: rawModel,
      messages,
      stream,
      temperature,
      max_tokens,
      ...(tools && tools.length ? { tools, tool_choice } : {})
    };

    // Cascade to Puter or Kilo proxy for DDG models if DDG rate limits
    const proxyUrl = 'https://api.puter.com/puterai/openai/v1/chat/completions';
    let targetModel = 'gpt-4o-mini';
    if (rawModel.includes('claude')) targetModel = 'claude-3-5-sonnet';
    else if (rawModel.includes('llama')) targetModel = 'llama-3.3-70b';

    try {
      const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, model: targetModel }),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return res;
    } catch {}

    const fallbackRes = await fetch('https://text.pollinations.ai/openai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, model: 'openai' }),
      signal: AbortSignal.timeout(8000)
    });

    if (!fallbackRes.ok) {
      const errText = await fallbackRes.text();
      const err = new Error(`DuckDuckGo gateway error ${fallbackRes.status}: ${errText}`);
      err.status = fallbackRes.status;
      throw err;
    }

    return fallbackRes;
  }
}
