import { BaseAdapter } from './base.js';

export class OpenAIAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'openai',
      name: 'OpenAI (Official Paid / BYOK)',
      badge: 'Official Paid & BYOK',
      getKeyUrl: 'https://platform.openai.com/api-keys',
      guide: 'Enter your official OpenAI API key (sk-proj-... or sk-...) to access GPT-4o, o1, o3-mini, and GPT-4o-mini directly.',
      freeTierInfo: 'BYOK (Pay-As-You-Go / Tier 1-5 Credits)',
      popularModels: 'gpt-4o, o3-mini, o1, gpt-4o-mini, chatgpt-4o-latest',
      keyPrefix: 'sk-',
      keyPlaceholder: 'sk-proj-... or sk-...'
    });
    this.baseUrl = 'https://api.openai.com/v1';
    this.fallbackModels = [
      { id: 'gpt-4o', name: 'GPT-4o (Omni Frontier)', context: 128000, caps: 'chat,code,vision' },
      { id: 'o3-mini', name: 'o3-mini (High-Speed Reasoning)', context: 200000, caps: 'chat,reasoning,code' },
      { id: 'o1', name: 'OpenAI o1 (Deep STEM Reasoning)', context: 128000, caps: 'chat,reasoning' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context: 128000, caps: 'chat,fast,vision' },
      { id: 'chatgpt-4o-latest', name: 'ChatGPT-4o Latest (Dynamic)', context: 128000, caps: 'chat,code' }
    ];
  }

  async discoverModels(apiKey) {
    if (!apiKey || !apiKey.trim()) {
      return this.fallbackModels.map(m => ({
        id: `openai/${m.id}`,
        provider: 'openai',
        model_id: m.id,
        display_name: `${m.name} [OpenAI Official]`,
        description: 'Official OpenAI Frontier Model',
        context_window: m.context,
        is_free: 0,
        capabilities: m.caps
      }));
    }

    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const chatModels = (data.data || []).filter(m => 
        m.id.startsWith('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3') || m.id.startsWith('chatgpt-')
      );
      if (!chatModels.length) throw new Error('No chat models found');
      return chatModels.map(m => ({
        id: `openai/${m.id}`,
        provider: 'openai',
        model_id: m.id,
        display_name: `${m.id} [OpenAI Official]`,
        description: 'Official OpenAI Model',
        context_window: 128000,
        is_free: 0,
        capabilities: m.id.includes('o1') || m.id.includes('o3') ? 'chat,reasoning' : 'chat,code,general'
      }));
    } catch {
      return this.fallbackModels.map(m => ({
        id: `openai/${m.id}`,
        provider: 'openai',
        model_id: m.id,
        display_name: `${m.name} [OpenAI Official]`,
        description: 'Official OpenAI Frontier Model',
        context_window: m.context,
        is_free: 0,
        capabilities: m.caps
      }));
    }
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    if (!apiKey || !apiKey.trim()) {
      const err = new Error('OpenAI API key is required. Provide your sk-proj-... key.');
      err.status = 401;
      throw err;
    }
    const rawModel = model.replace(/^openai\//, '');
    const isReasoning = rawModel.startsWith('o1') || rawModel.startsWith('o3');

    const body = {
      model: rawModel,
      messages,
      stream,
      ...(isReasoning ? {} : (temperature !== undefined ? { temperature } : {})),
      ...(max_tokens !== undefined ? (isReasoning ? { max_completion_tokens: max_tokens } : { max_tokens }) : {}),
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
      const err = new Error(`OpenAI API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    return res;
  }
}
