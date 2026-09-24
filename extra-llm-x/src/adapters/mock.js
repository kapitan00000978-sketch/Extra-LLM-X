import { BaseAdapter } from './base.js';
import { Readable } from 'stream';

export class MockDemoAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'mock',
      name: 'Extra LLM X Demo Engine',
      badge: 'Built-in Zero-Key Demo',
      getKeyUrl: '#',
      guide: 'Works instantly without any API keys for testing and verification.',
      freeTierInfo: 'Unlimited built-in offline test engine',
      popularModels: 'extra-demo-model, extra-demo-coder',
      keyPrefix: '',
      keyPlaceholder: 'No key needed'
    });
    this.freeModels = [
      { id: 'extra-demo-model', name: 'Extra LLM X Demo AI', context: 32768, caps: 'chat,fast' },
      { id: 'extra-demo-coder', name: 'Extra LLM X Demo Coder', context: 32768, caps: 'chat,code' }
    ];
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `mock/${m.id}`,
      provider: 'mock',
      model_id: m.id,
      display_name: `${m.name} [Built-in Demo]`,
      description: 'Zero-key instant local demo simulation model',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || 'Hello';
    const now = Math.floor(Date.now() / 1000);
    const replyText = `⚡ [Extra LLM X Demo Engine]
Successfully received prompt: "${typeof lastUserMsg === 'string' ? lastUserMsg.slice(0, 80) : 'Multimodal message'}".
All Extra LLM X routes (/v1/chat/completions, /v1/models, SSE streaming) are 100% active and operational!
To enable live inference through Groq, Google Gemini, OpenRouter, or SambaNova, simply add your free API key in the dashboard at http://localhost:3000.`;

    if (stream) {
      // Simulate real Server-Sent Events stream chunk by chunk
      const words = replyText.split(' ');
      let wordIdx = 0;

      const readableStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          for (let i = 0; i < words.length; i++) {
            const word = words[i] + (i < words.length - 1 ? ' ' : '');
            const chunk = {
              id: `chatcmpl-${Date.now()}-${i}`,
              object: 'chat.completion.chunk',
              created: now,
              model: model || 'extra/auto-free',
              choices: [
                {
                  index: 0,
                  delta: { content: word },
                  finish_reason: i === words.length - 1 ? 'stop' : null
                }
              ]
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            await new Promise(r => setTimeout(r, 20)); // 20ms simulated token typing
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      return new Response(readableStream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
      });
    } else {
      const responseData = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: now,
        model: model || 'extra/auto-free',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: replyText
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 15,
          completion_tokens: replyText.split(' ').length,
          total_tokens: 15 + replyText.split(' ').length
        }
      };

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
