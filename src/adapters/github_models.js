import { BaseAdapter } from './base.js';

export class GitHubModelsAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'github',
      name: 'GitHub Models',
      badge: 'GPT-4o & Phi-4 Free',
      getKeyUrl: 'https://github.com/settings/tokens',
      guide: 'Generate GitHub Personal Access Token (classic or fine-grained) with read access.',
      freeTierInfo: '150 req/day free with any GitHub Account',
      popularModels: 'gpt-4o, Phi-4, Llama-3.3-70B',
      keyPrefix: 'ghp_',
      keyPlaceholder: 'ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_...'
    });
    this.baseUrl = 'https://models.inference.ai.azure.com';
    this.freeModels = [
      { id: 'gpt-4o', name: 'GitHub GPT-4o', context: 128000, caps: 'chat,vision,code' },
      { id: 'gpt-4o-mini', name: 'GitHub GPT-4o Mini', context: 128000, caps: 'chat,fast' },
      { id: 'Phi-4', name: 'GitHub Phi-4 (14B)', context: 16384, caps: 'chat,code,reasoning' },
      { id: 'Meta-Llama-3.3-70B-Instruct', name: 'GitHub Llama 3.3 70B', context: 128000, caps: 'chat,code' }
    ];
  }

  async discoverModels(apiKey) {
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

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^github\//, '');
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
      const err = new Error(`GitHub Models error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
