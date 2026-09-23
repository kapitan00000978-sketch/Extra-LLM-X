import { BaseProvider } from './base.js';

export class HuggingFaceProvider extends BaseProvider {
  constructor() {
    super('huggingface', 'Hugging Face Serverless (Free HF Token)');
    this.baseUrl = 'https://router.huggingface.co/hf-inference/v1';

    this.freeModels = [
      { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'HF Qwen 2.5 Coder 32B', context: 32768, caps: 'chat,code' },
      { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', name: 'HF DeepSeek R1 Qwen 32B', context: 32768, caps: 'chat,reasoning' },
      { id: 'meta-llama/Llama-3.2-3B-Instruct', name: 'HF Llama 3.2 3B', context: 8192, caps: 'chat,fast' }
    ];
  }

  async scanModels(apiKey) {
    return this.freeModels.map(m => ({
      id: `huggingface/${m.id}`,
      provider: 'huggingface',
      model_id: m.id,
      display_name: `${m.name} [HuggingFace Free]`,
      description: 'Hugging Face Serverless Free Inference with User Token',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async complete({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModelId = model.replace(/^huggingface\//, '');
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
      const err = new Error(`HuggingFace API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
