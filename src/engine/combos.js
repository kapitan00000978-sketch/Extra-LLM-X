// Virtual combos with instant automatic failover across 70+ providers

export const VirtualCombos = {
  'extra/auto-free': {
    id: 'extra/auto-free',
    display_name: '⚡ Extra Auto Free Tier (#free)',
    description: 'Auto-routes to the best free model with instant failover across all 70+ providers',
    capabilities: 'chat,code,general',
    targets: [
      { provider: 'deepseek', model: 'deepseek-chat' },
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      { provider: 'sambanova', model: 'Meta-Llama-3.3-70B-Instruct' },
      { provider: 'duckduckgo', model: 'gpt-4o-mini' },
      { provider: 'blackbox', model: 'deepseek-v3' },
      { provider: 'xai', model: 'grok-2-1212' },
      { provider: 'perplexity', model: 'sonar' },
      { provider: 'dashscope', model: 'qwen-plus' },
      { provider: 'nebius', model: 'meta-llama/Llama-3.3-70B-Instruct' },
      { provider: 'nvidia', model: 'meta/llama-3.3-70b-instruct' },
      { provider: 'hyperbolic', model: 'meta-llama/Llama-3.3-70B-Instruct' },
      { provider: 'gemini', model: 'gemini-2.0-flash' },
      { provider: 'moonshot', model: 'moonshot-v1-8k' },
      { provider: 'minimax', model: 'abab6.5s-chat' },
      { provider: 'lingyiwanwu', model: 'yi-large' },
      { provider: 'stepfun', model: 'step-1-8k' },
      { provider: 'scaleway', model: 'llama-3.3-70b-instruct' },
      { provider: 'friendli', model: 'meta-llama-3.1-70b-instruct' },
      { provider: 'lepton', model: 'llama3-3-70b' },
      { provider: 'poe', model: 'Llama-3.3-70B-T' },
      { provider: 'zhipu', model: 'glm-4-flash' },
      { provider: 'baichuan', model: 'Baichuan3-Turbo' },
      { provider: 'hunyuan', model: 'hunyuan-standard' },
      { provider: 'sensenova', model: 'SenseChat-5' },
      { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free' },
      { provider: 'cerebras', model: 'llama-3.3-70b' },
      { provider: 'aimlapi', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
      { provider: 'chutes', model: 'deepseek-ai/DeepSeek-V3' },
      { provider: 'siliconflow', model: 'Qwen/Qwen2.5-7B-Instruct' },
      { provider: 'github', model: 'gpt-4o-mini' },
      { provider: 'together', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
      { provider: 'fireworks', model: 'accounts/fireworks/models/llama-v3p3-70b-instruct' },
      { provider: 'pollinations', model: 'openai' },
      { provider: 'opencode', model: 'deepseek-v3' },
      { provider: 'kilo', model: 'kilo-auto/free' },
      { provider: 'puter', model: 'gpt-4o-mini' },
      { provider: 'mock', model: 'extra-demo-model' }
    ]
  },
  'extra/frontier': {
    id: 'extra/frontier',
    display_name: '👑 Extra Frontier Ultra (#frontier, Paid & Zero-Key)',
    description: 'Ultra flagship cascade (Claude 3.7 Sonnet, GPT-4o, o3-mini, o1, DeepSeek-R1) via zero-key proxies and direct paid BYOK keys',
    capabilities: 'chat,code,reasoning,vision',
    targets: [
      { provider: 'anthropic', model: 'claude-3-7-sonnet-20250219' },
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'kilo', model: 'claude-3-7-sonnet' },
      { provider: 'puter', model: 'claude-3-7-sonnet' },
      { provider: 'blackbox', model: 'claude-3-5-sonnet' },
      { provider: 'kilo', model: 'gpt-4o' },
      { provider: 'puter', model: 'gpt-4o' },
      { provider: 'blackbox', model: 'gpt-4o' },
      { provider: 'duckduckgo', model: 'claude-3-haiku-20240307' },
      { provider: 'shuttleai', model: 'claude-3-5-sonnet' },
      { provider: 'openai', model: 'o3-mini' },
      { provider: 'kilo', model: 'o3-mini' },
      { provider: 'puter', model: 'o3-mini' },
      { provider: 'upstage', model: 'solar-pro' },
      { provider: 'baichuan', model: 'Baichuan4' },
      { provider: 'hunyuan', model: 'hunyuan-large' },
      { provider: 'sensenova', model: 'SenseChat-5' },
      { provider: 'openrouter', model: 'anthropic/claude-3.7-sonnet' },
      { provider: 'github', model: 'gpt-4o' },
      { provider: 'pollinations', model: 'openai' },
      { provider: 'deepseek', model: 'deepseek-reasoner' },
      { provider: 'mock', model: 'extra-demo-model' }
    ]
  },
  'extra/free-coding': {
    id: 'extra/free-coding',
    display_name: '💻 Extra Free Coding Specialist (#coding)',
    description: 'High-precision free coding chain (Codestral, DeepSeek-V3, Qwen 2.5 Coder, Llama 3.3 70B, Blackbox)',
    capabilities: 'chat,code',
    targets: [
      { provider: 'mistral', model: 'codestral-latest' },
      { provider: 'blackbox', model: 'blackbox-coder' },
      { provider: 'blackbox', model: 'deepseek-v3' },
      { provider: 'deepseek', model: 'deepseek-chat' },
      { provider: 'dashscope', model: 'qwen2.5-coder-32b-instruct' },
      { provider: 'nebius', model: 'Qwen/Qwen2.5-Coder-32B-Instruct' },
      { provider: 'gmicloud', model: 'qwen/qwen-2.5-coder-32b' },
      { provider: 'lepton', model: 'qwen2-5-coder-32b' },
      { provider: 'watsonx', model: 'ibm/granite-3-8b-instruct' },
      { provider: 'baseten', model: 'llama-3.3-70b-instruct' },
      { provider: 'scaleway', model: 'llama-3.3-70b-instruct' },
      { provider: 'sambanova', model: 'Qwen2.5-Coder-32B-Instruct' },
      { provider: 'hyperbolic', model: 'Qwen/Qwen2.5-Coder-32B-Instruct' },
      { provider: 'zhipu', model: 'glm-4-flash' },
      { provider: 'nvidia', model: 'meta/llama-3.3-70b-instruct' },
      { provider: 'aimlapi', model: 'Qwen/Qwen2.5-72B-Instruct' },
      { provider: 'openrouter', model: 'qwen/qwen-2.5-coder-32b-instruct:free' },
      { provider: 'kilo', model: 'qwen-2.5-coder-32b' },
      { provider: 'puter', model: 'claude-3-5-sonnet' },
      { provider: 'groq', model: 'qwen-2.5-32b' },
      { provider: 'gemini', model: 'gemini-2.0-flash' },
      { provider: 'github', model: 'gpt-4o' },
      { provider: 'huggingface', model: 'Qwen/Qwen2.5-Coder-32B-Instruct' },
      { provider: 'pollinations', model: 'qwen' },
      { provider: 'opencode', model: 'qwen-2.5-72b' },
      { provider: 'mock', model: 'extra-demo-coder' }
    ]
  },
  'extra/free-fast': {
    id: 'extra/free-fast',
    display_name: '⚡ Extra Free Fast (#fast, 500-2000 tok/s)',
    description: 'Sub-second agent execution loops via Cerebras, Groq, DuckDuckGo, Spark Lite, and ERNIE Speed LPUs',
    capabilities: 'chat,fast',
    targets: [
      { provider: 'cerebras', model: 'llama3.1-8b' },
      { provider: 'groq', model: 'llama-3.1-8b-instant' },
      { provider: 'duckduckgo', model: 'gpt-4o-mini' },
      { provider: 'upstage', model: 'solar-mini' },
      { provider: 'iflytek', model: 'lite' },
      { provider: 'qianfan', model: 'ernie-speed-8k' },
      { provider: 'segmind', model: 'llama-3-8b-instruct' },
      { provider: 'ai21', model: 'jamba-1.5-mini' },
      { provider: 'volcengine', model: 'doubao-lite-4k' },
      { provider: 'nlpcloud', model: 'dolphin' },
      { provider: 'zhipu', model: 'glm-4-flash' },
      { provider: 'siliconflow', model: 'Qwen/Qwen2.5-7B-Instruct' },
      { provider: 'gemini', model: 'gemini-2.0-flash-lite' },
      { provider: 'hyperbolic', model: 'meta-llama/Meta-Llama-3.1-8B-Instruct' },
      { provider: 'sambanova', model: 'Meta-Llama-3.1-8B-Instruct' },
      { provider: 'openrouter', model: 'meta-llama/llama-3.1-8b-instruct:free' },
      { provider: 'pollinations', model: 'openai' },
      { provider: 'mock', model: 'extra-demo-model' }
    ]
  },
  'extra/free-reasoning': {
    id: 'extra/free-reasoning',
    display_name: '🧠 Extra Free Deep Reasoning (#reasoning, DeepSeek-R1)',
    description: 'Native chain-of-thought mathematical reasoning via DeepSeek-R1, Sonar, Step-2, and Scaleway',
    capabilities: 'chat,reasoning',
    targets: [
      { provider: 'deepseek', model: 'deepseek-reasoner' },
      { provider: 'perplexity', model: 'sonar-reasoning' },
      { provider: 'stepfun', model: 'step-2-16k' },
      { provider: 'scaleway', model: 'deepseek-r1-distill-llama-70b' },
      { provider: 'lepton', model: 'deepseek-r1' },
      { provider: 'inference_net', model: 'deepseek-ai/deepseek-r1' },
      { provider: 'replicate', model: 'deepseek-ai/deepseek-r1' },
      { provider: 'sambanova', model: 'DeepSeek-R1' },
      { provider: 'chutes', model: 'deepseek-ai/DeepSeek-R1' },
      { provider: 'nvidia', model: 'deepseek-ai/deepseek-r1' },
      { provider: 'groq', model: 'deepseek-r1-distill-llama-70b' },
      { provider: 'siliconflow', model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B' },
      { provider: 'openrouter', model: 'deepseek/deepseek-r1:free' },
      { provider: 'huggingface', model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B' },
      { provider: 'fireworks', model: 'accounts/fireworks/models/deepseek-r1' },
      { provider: 'pollinations', model: 'deepseek' },
      { provider: 'opencode', model: 'deepseek-v3' },
      { provider: 'mock', model: 'extra-demo-model' }
    ]
  },
  'extra/free-vision': {
    id: 'extra/free-vision',
    display_name: '👁️ Extra Free Multimodal Vision (#vision)',
    description: 'Multimodal vision and image reasoning free models',
    capabilities: 'chat,vision',
    targets: [
      { provider: 'gemini', model: 'gemini-2.0-flash' },
      { provider: 'xai', model: 'grok-2-vision-1212' },
      { provider: 'reka', model: 'reka-flash' },
      { provider: 'stepfun', model: 'step-1-8k' },
      { provider: 'gemini', model: 'gemini-1.5-flash' },
      { provider: 'github', model: 'gpt-4o' },
      { provider: 'openrouter', model: 'google/gemini-2.0-flash-exp:free' },
      { provider: 'pollinations', model: 'openai' },
      { provider: 'mock', model: 'extra-demo-model' }
    ]
  }
};

export const OMNIROUTE_TAG_MAP = {
  '#frontier': 'extra/frontier',
  '#paid': 'extra/frontier',
  'frontier': 'extra/frontier',
  'paid': 'extra/frontier',
  '#coding': 'extra/free-coding',
  '#reasoning': 'extra/free-reasoning',
  '#fast': 'extra/free-fast',
  '#vision': 'extra/free-vision',
  '#free': 'extra/auto-free',
  'auto': 'extra/auto-free',
  'default': 'extra/auto-free'
};

export function getCombo(comboId) {
  if (!comboId) return null;
  const normalized = comboId.trim().toLowerCase();
  const alias = OMNIROUTE_TAG_MAP[normalized];
  if (alias) return VirtualCombos[alias];
  return VirtualCombos[comboId] || null;
}

export function getAllCombos() {
  return Object.values(VirtualCombos);
}
