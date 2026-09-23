import { BaseProvider } from './base.js';

export class GitHubModelsProvider extends BaseProvider {
  constructor() {
    super('github', 'GitHub Models (Free with GitHub PAT)');
    this.baseUrl = 'https://models.inference.ai.azure.com';

    this.freeModels = [
      { id: 'gpt-4o', name: 'GitHub GPT-4o', context: 128000, caps: 'chat,vision,code' },
      { id: 'gpt-4o-mini', name: 'GitHub GPT-4o Mini', context: 128000, caps: 'chat,fast' },
      { id: 'Phi-4', name: 'GitHub Phi-4 (14B)', context: 16384, caps: 'chat,code,reasoning' },
      { id: 'Meta-Llama-3.3-70B-Instruct', name: 'GitHub Llama 3.3 70B', context: 128000, caps: 'chat,code' }
    ];
  }

  async scanModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `github/${m.id}`,
      provider: 'github',
      model_id: m.id,
      display_name: `${m.name} [GitHub Models Free]`,
      description: 'GitHub Azure AI Free Developer Tier with GitHub PAT',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async complete({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModelId = model.replace(/^github\//, '');
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
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`GitHub Models error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
