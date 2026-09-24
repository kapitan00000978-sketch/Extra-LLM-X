export const VirtualCombos = {
  'extra/auto-free': {
    id: 'extra/auto-free',
    display_name: '⚡ Extra Auto Free (Optimal Best)',
    description: 'Auto-routes to the best free model with instant failover across all 24+ providers',
    capabilities: 'chat,code,general',
    targets: [
      { provider: 'deepseek', model: 'deepseek-chat' },
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      { provider: 'sambanova', model: 'Meta-Llama-3.3-70B-Instruct' },
      { provider: 'nvidia', model: 'meta/llama-3.3-70b-instruct' },
      { provider: 'hyperbolic', model: 'meta-llama/Llama-3.3-70B-Instruct' },
      { provider: 'gemini', model: 'gemini-2.0-flash' },
      { provider: 'zhipu', model: 'glm-4-flash' },
      { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free' },
      { provider: 'cerebras', model: 'llama-3.3-70b' },
      { provider: 'aimlapi', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
      { provider: 'chutes', model: 'deepseek-ai/DeepSeek-V3' },
      { provider: 'siliconflow', model: 'Qwen/Qwen2.5-7B-Instruct' },
      { provider: 'github', model: 'gpt-4o-mini' },
      { provider: 'together', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
      { provider: 'fireworks', model: 'accounts/fireworks/models/llama-v3p3-70b-instruct' },
      { provider: 'mock', model: 'extra-demo-model' }
    ]
  },
  'extra/free-coding': {
    id: 'extra/free-coding',
    display_name: '💻 Extra Free Coding Specialist',
    description: 'High-precision free coding chain (Codestral, DeepSeek-V3, Qwen 2.5 Coder, Llama 3.3 70B)',
    capabilities: 'chat,code',
    targets: [
      { provider: 'mistral', model: 'codestral-latest' },
      { provider: 'deepseek', model: 'deepseek-chat' },
      { provider: 'sambanova', model: 'Qwen2.5-Coder-32B-Instruct' },
      { provider: 'hyperbolic', model: 'Qwen/Qwen2.5-Coder-32B-Instruct' },
      { provider: 'zhipu', model: 'glm-4-flash' },
      { provider: 'nvidia', model: 'meta/llama-3.3-70b-instruct' },
      { provider: 'aimlapi', model: 'Qwen/Qwen2.5-72B-Instruct' },
      { provider: 'openrouter', model: 'qwen/qwen-2.5-coder-32b-instruct:free' },
      { provider: 'groq', model: 'qwen-2.5-32b' },
      { provider: 'gemini', model: 'gemini-2.0-flash' },
      { provider: 'github', model: 'gpt-4o' },
      { provider: 'huggingface', model: 'Qwen/Qwen2.5-Coder-32B-Instruct' },
      { provider: 'mock', model: 'extra-demo-coder' }
    ]
  },
  'extra/free-fast': {
    id: 'extra/free-fast',
    display_name: '🚀 Extra Free Fast (500-2000 tok/s)',
    description: 'Sub-second agent execution loops via Cerebras, Groq, and GLM-4 LPUs',
    capabilities: 'chat,fast',
    targets: [
      { provider: 'cerebras', model: 'llama3.1-8b' },
      { provider: 'groq', model: 'llama-3.1-8b-instant' },
      { provider: 'zhipu', model: 'glm-4-flash' },
      { provider: 'siliconflow', model: 'Qwen/Qwen2.5-7B-Instruct' },
      { provider: 'gemini', model: 'gemini-2.0-flash-lite' },
      { provider: 'hyperbolic', model: 'meta-llama/Meta-Llama-3.1-8B-Instruct' },
      { provider: 'sambanova', model: 'Meta-Llama-3.1-8B-Instruct' },
      { provider: 'openrouter', model: 'meta-llama/llama-3.1-8b-instruct:free' },
      { provider: 'mock', model: 'extra-demo-model' }
    ]
  },
  'extra/free-reasoning': {
    id: 'extra/free-reasoning',
    display_name: '🧠 Extra Free Deep Reasoning (DeepSeek-R1 Native)',
    description: 'Native chain-of-thought mathematical and architectural reasoning via DeepSeek Official, SambaNova, and Chutes',
    capabilities: 'chat,reasoning',
    targets: [
      { provider: 'deepseek', model: 'deepseek-reasoner' },
      { provider: 'sambanova', model: 'DeepSeek-R1' },
      { provider: 'chutes', model: 'deepseek-ai/DeepSeek-R1' },
      { provider: 'nvidia', model: 'deepseek-ai/deepseek-r1' },
      { provider: 'groq', model: 'deepseek-r1-distill-llama-70b' },
      { provider: 'siliconflow', model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B' },
      { provider: 'openrouter', model: 'deepseek/deepseek-r1:free' },
      { provider: 'huggingface', model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B' },
      { provider: 'fireworks', model: 'accounts/fireworks/models/deepseek-r1' },
      { provider: 'mock', model: 'extra-demo-model' }
    ]
  },
  'extra/free-vision': {
    id: 'extra/free-vision',
    display_name: '👁️ Extra Free Multimodal Vision',
    description: 'Multimodal vision and image reasoning free models',
    capabilities: 'chat,vision',
    targets: [
      { provider: 'gemini', model: 'gemini-2.0-flash' },
      { provider: 'gemini', model: 'gemini-1.5-flash' },
      { provider: 'github', model: 'gpt-4o' },
      { provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free' },
      { provider: 'mock', model: 'extra-demo-model' }
    ]
  }
};

export function getCombo(comboId) {
  return VirtualCombos[comboId] || null;
}

export function getAllCombos() {
  return Object.values(VirtualCombos);
}
