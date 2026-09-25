import { BaseAdapter } from './base.js';

export class AnthropicAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'anthropic',
      name: 'Anthropic (Official Claude Paid / BYOK)',
      badge: 'Official Paid & BYOK',
      getKeyUrl: 'https://console.anthropic.com/settings/keys',
      guide: 'Enter your official Anthropic API key (sk-ant-...) to access Claude 3.7 Sonnet, Claude 3.5 Sonnet, and Claude 3.5 Haiku directly.',
      freeTierInfo: 'BYOK (Pay-As-You-Go Credits / Enterprise Tier)',
      popularModels: 'claude-3-7-sonnet-20250219, claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus-20240229',
      keyPrefix: 'sk-ant-',
      keyPlaceholder: 'sk-ant-api03-...'
    });
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.models = [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid Reasoning)', context: 200000, caps: 'chat,code,reasoning' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Coding Champion)', context: 200000, caps: 'chat,code,reasoning' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast & Precise)', context: 200000, caps: 'chat,fast,code' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Deep Analysis)', context: 200000, caps: 'chat,reasoning' }
    ];
  }

  async discoverModels(apiKey) {
    return this.models.map(m => ({
      id: `anthropic/${m.id}`,
      provider: 'anthropic',
      model_id: m.id,
      display_name: `${m.name} [Anthropic Official]`,
      description: 'Official Anthropic Claude Model',
      context_window: m.context,
      is_free: 0,
      capabilities: m.caps
    }));
  }

  formatMessagesForAnthropic(messages = []) {
    let system = '';
    const formatted = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        system = system ? `${system}\n\n${text}` : text;
      } else {
        const role = msg.role === 'assistant' ? 'assistant' : 'user';
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        
        // Merge consecutive messages with the same role
        if (formatted.length > 0 && formatted[formatted.length - 1].role === role) {
          formatted[formatted.length - 1].content += `\n\n${content}`;
        } else {
          formatted.push({ role, content });
        }
      }
    }

    // Anthropic requires the first message to be from 'user'
    if (formatted.length === 0) {
      formatted.push({ role: 'user', content: 'Hello' });
    } else if (formatted[0].role !== 'user') {
      formatted.unshift({ role: 'user', content: 'Hello' });
    }

    return { system, messages: formatted };
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    if (!apiKey || !apiKey.trim()) {
      const err = new Error('Anthropic API key is required. Provide your sk-ant-... key.');
      err.status = 401;
      throw err;
    }

    let rawModel = model.replace(/^anthropic\//, '');
    if (rawModel === 'claude-3-7-sonnet') rawModel = 'claude-3-7-sonnet-20250219';
    if (rawModel === 'claude-3-5-sonnet') rawModel = 'claude-3-5-sonnet-20241022';
    if (rawModel === 'claude-3-5-haiku') rawModel = 'claude-3-5-haiku-20241022';

    const { system, messages: anthropicMessages } = this.formatMessagesForAnthropic(messages);

    const body = {
      model: rawModel,
      messages: anthropicMessages,
      max_tokens: max_tokens || 4096,
      stream,
      ...(system ? { system } : {}),
      ...(temperature !== undefined ? { temperature } : {})
    };

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(`Anthropic API error ${res.status}: ${errText}`);
      err.status = res.status;
      err.headers = res.headers;
      throw err;
    }

    // If streaming, convert Anthropic SSE to OpenAI SSE
    if (stream && res.body) {
      const textDecoder = new TextDecoder();
      const textEncoder = new TextEncoder();
      let buffer = '';

      const transformStream = new TransformStream({
        transform(chunk, controller) {
          buffer += textDecoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const event = JSON.parse(dataStr);
              if (event.type === 'content_block_delta' && event.delta?.text) {
                const openaiChunk = {
                  id: `chatcmpl-${Date.now()}`,
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: rawModel,
                  choices: [
                    {
                      index: 0,
                      delta: { content: event.delta.text },
                      finish_reason: null
                    }
                  ]
                };
                controller.enqueue(textEncoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
              } else if (event.type === 'message_stop') {
                const finalChunk = {
                  id: `chatcmpl-${Date.now()}`,
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: rawModel,
                  choices: [
                    {
                      index: 0,
                      delta: {},
                      finish_reason: 'stop'
                    }
                  ]
                };
                controller.enqueue(textEncoder.encode(`data: ${JSON.stringify(finalChunk)}\n\n`));
                controller.enqueue(textEncoder.encode('data: [DONE]\n\n'));
              }
            } catch {
              // ignore unparseable internal ping events
            }
          }
        },
        flush(controller) {
          controller.enqueue(textEncoder.encode('data: [DONE]\n\n'));
        }
      });

      return new Response(res.body.pipeThrough(transformStream), {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Non-streaming response translation to OpenAI format
    const data = await res.json();
    const textContent = (data.content || [])
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('');

    const openAiFormat = {
      id: data.id || `anthropic-${Date.now()}`,
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
          finish_reason: data.stop_reason === 'end_turn' ? 'stop' : (data.stop_reason === 'max_tokens' ? 'length' : 'stop')
        }
      ],
      usage: {
        prompt_tokens: data.usage?.input_tokens || 0,
        completion_tokens: data.usage?.output_tokens || 0,
        total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      }
    };

    return new Response(JSON.stringify(openAiFormat), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
