import { BaseProvider } from './base.js';

export class OpenRouterProvider extends BaseProvider {
  constructor() {
    super('openrouter', 'OpenRouter');
    this.baseUrl = 'https://openrouter.ai/api/v1';
    
    // Curated fallback list of known top free models on OpenRouter
    this.knownFreeModels = [
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', context: 64000, caps: 'chat,reasoning' },
      { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek V3 (Free)', context: 64000, caps: 'chat,code' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (Free)', context: 131072, caps: 'chat,code' },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Exp (Free)', context: 1048576, caps: 'chat,vision,code' },
      { id: 'google/gemini-2.0-flash-thinking-exp:free', name: 'Gemini 2.0 Flash Thinking (Free)', context: 32768, caps: 'chat,reasoning' },
      { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B (Free)', context: 32768, caps: 'chat,code' },
      { id: 'mistralai/mistral-small-24b-instruct-2501:free', name: 'Mistral Small 24B (Free)', context: 32768, caps: 'chat,code' },
      { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B Instruct (Free)', context: 131072, caps: 'chat,fast' }
    ];
  }

  async scanModels(apiKey) {
    try {
      const headers = { 'User-Agent': 'Extra-LLM-X-Gateway' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      
      const res = await fetch(`${this.baseUrl}/models`, {
        headers,
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) {
        throw new Error(`OpenRouter models error HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.data || !Array.isArray(data.data)) {
        return this.getFallbackModels();
      }

      // Filter STRICTLY for free models (pricing == 0 or id ending with :free)
      const freeModels = data.data.filter(m => {
        const idMatches = (m.id || '').endsWith(':free');
        const priceMatches = m.pricing && 
          (m.pricing.prompt === '0' || m.pricing.prompt === 0) &&
          (m.pricing.completion === '0' || m.pricing.completion === 0);
        return idMatches || priceMatches;
      });

      if (freeModels.length === 0) {
        return this.getFallbackModels();
      }

      return freeModels.map(m => ({
        id: `openrouter/${m.id}`,
        provider: 'openrouter',
        model_id: m.id,
        display_name: `${m.name || m.id} [OpenRouter Free]`,
        description: m.description || 'OpenRouter 100% Free Tier Model',
        context_window: m.context_length || 32768,
        is_free: 1,
        capabilities: m.id.includes('coder') ? 'chat,code' : (m.id.includes('r1') ? 'chat,reasoning' : 'chat')
      }));
    } catch (e) {
      console.warn(`[OpenRouter] Dynamic scan failed (${e.message}), using verified free catalog.`);
      return this.getFallbackModels();
    }
  }

  getFallbackModels() {
    return this.knownFreeModels.map(m => ({
      id: `openrouter/${m.id}`,
      provider: 'openrouter',
      model_id: m.id,
      display_name: `${m.name} [OpenRouter Free]`,
      description: 'OpenRouter Free Model',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async complete({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModelId = model.replace(/^openrouter\//, '');
    const body = {
      model: rawModelId,
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
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Extra LLM X Free Gateway'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`OpenRouter API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
