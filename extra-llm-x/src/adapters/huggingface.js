import { BaseAdapter } from './base.js';

export class HuggingFaceAdapter extends BaseAdapter {
  constructor() {
    super({
      id: 'huggingface',
      name: 'Hugging Face',
      badge: 'Serverless Free',
      getKeyUrl: 'https://huggingface.co/settings/tokens',
      guide: 'Create free User Access Token (Read) in Hugging Face settings.',
      freeTierInfo: 'Free Serverless Inference API with user token',
      popularModels: 'Qwen2.5-Coder-32B-Instruct, DeepSeek-R1-Qwen-32B',
      keyPrefix: 'hf_',
      keyPlaceholder: 'hf_xxxxxxxxxxxxxxxxxxxx'
    });
    this.baseUrl = 'https://router.huggingface.co/hf-inference/v1';
    this.freeModels = [
      { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'HF Qwen 2.5 Coder 32B', context: 32768, caps: 'chat,code' },
      { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', name: 'HF DeepSeek R1 Qwen 32B', context: 32768, caps: 'chat,reasoning' },
      { id: 'meta-llama/Llama-3.2-3B-Instruct', name: 'HF Llama 3.2 3B', context: 8192, caps: 'chat,fast' }
    ];
  }

  async discoverModels(apiKey) {
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

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^huggingface\//, '');
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
      const err = new Error(`HuggingFace API error ${res.status}: ${errText}`);
      err.status = res.status;
      throw err;
    }

    return res;
  }
}
