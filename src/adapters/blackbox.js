import { BaseAdapter } from './base.js';

export class BlackboxAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'blackbox',
      name: 'Blackbox AI (Zero-Key Coding & Frontier)',
      badge: 'Zero-Key & Coding Gateway',
      getKeyUrl: 'https://www.blackbox.ai',
      guide: 'Routes to DeepSeek-V3, Claude 3.5 Sonnet, and GPT-4o with zero key required, optimized for programming & terminal workflows.',
      freeTierInfo: '100% Free Public Coding Inference & BYOK',
      popularModels: 'deepseek-v3, claude-3-5-sonnet, gpt-4o, blackbox-coder',
      keyPrefix: 'bb_',
      keyPlaceholder: 'bb_... or leave blank for zero-key free tier'
    });
    this.baseUrl = 'https://api.blackbox.ai/api/chat';
    this.isNoAuth = true;
    this.freeModels = [
      { id: 'deepseek-v3', name: 'Blackbox DeepSeek-V3', context: 65536, caps: 'chat,code' },
      { id: 'claude-3-5-sonnet', name: 'Blackbox Claude 3.5 Sonnet', context: 200000, caps: 'chat,code,reasoning' },
      { id: 'gpt-4o', name: 'Blackbox GPT-4o Omni', context: 128000, caps: 'chat,code,vision' },
      { id: 'blackbox-coder', name: 'Blackbox Code Wizard', context: 128000, caps: 'chat,code' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `blackbox/${m.id}`,
      provider: 'blackbox',
      model_id: m.id,
      display_name: `${m.name} [Blackbox Gateway]`,
      description: 'Blackbox Coding & Frontier AI Gateway',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^blackbox\//, '');
    const body = {
      model: rawModel,
      messages,
      stream,
      temperature,
      max_tokens,
      ...(tools && tools.length ? { tools, tool_choice } : {})
    };

    // Failover across Puter and Kilo for Blackbox models
    const fallbackUrl = 'https://api.puter.com/puterai/openai/v1/chat/completions';
    let targetModel = 'gpt-4o-mini';
    if (rawModel.includes('claude')) targetModel = 'claude-3-5-sonnet';
    else if (rawModel.includes('deepseek')) targetModel = 'deepseek-r1';
    else if (rawModel.includes('gpt-4o')) targetModel = 'gpt-4o';

    try {
      const res = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, model: targetModel }),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return res;
    } catch {}

    const altRes = await fetch('https://api.kilo.ai/api/gateway/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, model: 'kilo-auto/free' }),
      signal: AbortSignal.timeout(8000)
    });

    if (!altRes.ok) {
      const errText = await altRes.text();
      const err = new Error(`Blackbox gateway error ${altRes.status}: ${errText}`);
      err.status = altRes.status;
      throw err;
    }

    return altRes;
  }
}
