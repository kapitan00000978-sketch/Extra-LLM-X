import { BaseAdapter } from './base.js';

export class CohereAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'cohere',
      name: 'Cohere Trial',
      badge: 'Free Developer Trial',
      getKeyUrl: 'https://dashboard.cohere.com/api-keys',
      guide: 'Sign up on Cohere dashboard to generate a free Trial API Key.',
      freeTierInfo: 'Generous monthly developer trial calls',
      popularModels: 'command-r-plus, command-r',
      keyPrefix: '',
      keyPlaceholder: 'Paste Cohere Trial Key'
    });
    this.freeModels = [
      { id: 'command-r-plus-08-2024', name: 'Cohere Command R+', context: 128000, caps: 'chat,reasoning' },
      { id: 'command-r-08-2024', name: 'Cohere Command R', context: 128000, caps: 'chat,code' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `cohere/${m.id}`,
      provider: 'cohere',
      model_id: m.id,
      display_name: `${m.name} [Cohere Free Trial]`,
      description: 'Cohere Developer Trial API',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    // Cohere has a chat endpoint: POST https://api.cohere.com/v2/chat
    const rawModel = model.replace(/^cohere\//, '');
    const body = {
      model: rawModel,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream,
      temperature,
      max_tokens
    };

    const res = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Cohere API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    if (!stream) {
      const data = await res.json();
      const textContent = data.message?.content?.map(c => c.text).join('') || '';
      const openAiFormat = {
        id: data.id || `cohere-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: rawModel,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: textContent
            },
            finish_reason: data.finish_reason === 'COMPLETE' ? 'stop' : (data.finish_reason || 'stop')
          }
        ],
        usage: {
          prompt_tokens: data.usage?.tokens?.input_tokens || 0,
          completion_tokens: data.usage?.tokens?.output_tokens || 0,
          total_tokens: (data.usage?.tokens?.input_tokens || 0) + (data.usage?.tokens?.output_tokens || 0)
        }
      };

      return new Response(JSON.stringify(openAiFormat), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return res;
  }
}
