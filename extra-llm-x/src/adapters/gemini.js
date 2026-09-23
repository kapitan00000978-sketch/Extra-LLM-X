import { BaseAdapter } from './base.js';

export class GeminiAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'gemini',
      name: 'Google AI Studio',
      badge: '1M+ Context Free',
      getKeyUrl: 'https://aistudio.google.com/app/apikey',
      guide: 'Go to Google AI Studio, click "Create API key in new project".',
      freeTierInfo: '15 req/min, 1,500 req/day (Free Forever)',
      popularModels: 'gemini-2.0-flash, gemini-2.5-flash, gemini-1.5-pro',
      keyPrefix: 'AIzaSy',
      keyPlaceholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
    this.freeModels = [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', context: 1048576, caps: 'chat,vision,code,fast' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', context: 1048576, caps: 'chat,vision,code,fast' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', context: 1048576, caps: 'chat,fast' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', context: 1048576, caps: 'chat,vision,code' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', context: 2097152, caps: 'chat,vision,code,reasoning' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `gemini/${m.id}`,
      provider: 'gemini',
      model_id: m.id,
      display_name: `${m.name} [Gemini Free 1M+]`,
      description: 'Google AI Studio 15 RPM / 1,500 RPD Free Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^gemini\//, '');
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
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Gemini API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
