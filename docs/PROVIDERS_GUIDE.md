# Extra LLM X — Complete 70+ Provider & Proxy Master Guide

Extra LLM X bridges **70+ native AI providers and zero-key proxies** into a single OpenAI-compatible `/v1` endpoint. Whether you have $0 and want completely keyless inference across Claude 3.7 and GPT-4o, or you have official paid enterprise keys (OpenAI `sk-proj-...`, Anthropic `sk-ant-...`), Extra LLM X routes, balances, caches, and protects your requests with zero downtime.

---

## 1. Zero-Key Public Proxies & Gateways (No Key Required / 100% Free)

These adapters work out-of-the-box with **zero configuration and zero API keys**. They proxy into top frontier models and open-weights models for instant prototyping and development.

| Provider | Adapter ID | Popular Models | Context Window | Capabilities | Fallback Chain |
|---|---|---|---|---|---|
| **Kilo Gateway** | `kilo` | `claude-3-7-sonnet`, `claude-3-5-sonnet`, `gpt-4o`, `o3-mini`, `o1`, `deepseek-r1:free` | 200,000 | Chat, Code, Reasoning, Vision | Puter → Pollinations |
| **Puter Cloud AI** | `puter` | `claude-3-7-sonnet`, `claude-3-5-sonnet`, `gpt-4o`, `gpt-4o-mini`, `o3-mini`, `o1`, `deepseek-r1` | 200,000 | Chat, Code, Reasoning, Vision | Kilo → Pollinations |
| **DuckDuckGo AI** | `duckduckgo` | `gpt-4o-mini`, `claude-3-haiku-20240307`, `meta-llama/Llama-3.3-70B-Instruct`, `mixtral-8x7b` | 200,000 | Chat, Fast, Anonymous Privacy | Puter → Pollinations |
| **Blackbox AI** | `blackbox` | `deepseek-v3`, `claude-3-5-sonnet`, `gpt-4o`, `blackbox-coder` | 200,000 | Chat, Code, Terminal Coding | Puter → Kilo |
| **Pollinations AI** | `pollinations` | `openai` (GPT-4o), `claude` (3.5/3.7), `deepseek`, `qwen`, `mistral` | 200,000 | Chat, Code, Reasoning, Fast | OpenCode |
| **OpenCode Public** | `opencode` | `deepseek-v3`, `glm-4`, `qwen-2.5-72b`, `kimi-k2.5` | 128,000 | Chat, Code, Reasoning | Pollinations |

---

## 2. Official Paid & BYOK Frontier Providers

Enter your official paid vendor API keys to unlock maximum enterprise rate limits, 200k context windows, and priority compute.

### OpenAI Official (`openai`)
- **Portal**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Key Prefix**: `sk-proj-` or `sk-`
- **Supported Models**: `gpt-4o`, `o1`, `o3-mini`, `gpt-4o-mini`, `chatgpt-4o-latest`
- **Features**: Native reasoning token budget management (`max_completion_tokens`), streaming SSE, function/tool calling.

### Anthropic Official (`anthropic`)
- **Portal**: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- **Key Prefix**: `sk-ant-`
- **Supported Models**: `claude-3-7-sonnet-20250219`, `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229`
- **Features**: Automatic bidirectional translation between OpenAI Chat Completions and Anthropic Messages API (`/v1/messages`), system prompt segregation, streaming delta translation.

---

## 3. Multi-Model Aggregators & Cloud Providers

| Provider | Adapter ID | Portal Link | Key Format | Highlights |
|---|---|---|---|---|
| **OpenRouter** | `openrouter` | [openrouter.ai/keys](https://openrouter.ai/keys) | `sk-or-v1-...` | 40+ free `:free` models + paid frontier pass-through |
| **ShuttleAI** | `shuttleai` | [shuttleai.com/keys](https://shuttleai.com/keys) | `shuttle-...` | Multi-LLM proxy for Claude, GPT-4o, and DeepSeek-R1 |
| **Upstage Solar** | `upstage` | [console.upstage.ai](https://console.upstage.ai) | `up_...` | Solar Pro & Solar Mini (State-of-the-art reasoning) |
| **RunPod Serverless** | `runpod` | [runpod.io/console/serverless](https://www.runpod.io) | `rpa_...` | Serverless vLLM clusters on demand |
| **Lambda Labs** | `lambda` | [cloud.lambdalabs.com](https://cloud.lambdalabs.com) | `secret_...` | Hermes 3 405B & Llama 3.1 70B FP8 |
| **MonsterAPI** | `monsterapi` | [monsterapi.ai](https://monsterapi.ai) | Raw token | Serverless Llama 3.3 70B & Mistral |

---

## 4. Ultra-Fast LPU & Silicon Accelerators (500 – 2000 tok/s)

| Provider | Adapter ID | Free Quota | Key Prefix | Popular Models |
|---|---|---|---|---|
| **Groq Cloud** | `groq` | 30 RPM, 14,400 RPD free forever | `gsk_` | `llama-3.3-70b-versatile`, `qwen-2.5-32b` |
| **Cerebras Cloud** | `cerebras` | 30 RPM, 1M tok/day (2000 tok/s) | `csk-` | `llama-3.3-70b`, `llama3.1-8b` |
| **SambaNova Cloud** | `sambanova` | Generous developer tier | Raw token | `DeepSeek-R1`, `Meta-Llama-3.3-70B` |

---

## 5. Hyperscalers & Global Cloud AI

| Provider | Adapter ID | Portal Link | Free Quota | Key Models |
|---|---|---|---|---|
| **Google Gemini** | `gemini` | [aistudio.google.com](https://aistudio.google.com/app/apikey) | 15 RPM / 1,500 RPD (Free Forever) | `gemini-2.0-flash`, `gemini-1.5-pro` (2M Context) |
| **GitHub Models** | `github` | [github.com/settings/tokens](https://github.com/settings/tokens) | 150 requests/day | `gpt-4o`, `gpt-4o-mini`, `Phi-4` |
| **Mistral AI** | `mistral` | [console.mistral.ai](https://console.mistral.ai) | 1 req/sec free | `codestral-latest`, `mistral-small` |
| **Hugging Face** | `huggingface` | [huggingface.co/settings/tokens](https://huggingface.co) | Free Serverless API | `Qwen/Qwen2.5-Coder-32B-Instruct` |
| **Together AI** | `together` | [api.together.xyz](https://api.together.xyz) | $5.00 starter credits | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| **Cloudflare** | `cloudflare` | [dash.cloudflare.com](https://dash.cloudflare.com) | 10k neurons/day | `@cf/meta/llama-3.3-70b-instruct` |
| **Fireworks AI** | `fireworks` | [fireworks.ai](https://fireworks.ai) | Free trial tier | `accounts/fireworks/models/llama-v3p3-70b` |
| **DeepInfra** | `deepinfra` | [deepinfra.com](https://deepinfra.com) | Free trial tier | `meta-llama/Meta-Llama-3.1-8B-Instruct` |
| **Novita AI** | `novita` | [novita.ai](https://novita.ai) | Free starter credits | `meta-llama/llama-3.3-70b-instruct` |
| **Cohere** | `cohere` | [dashboard.cohere.com](https://dashboard.cohere.com) | Developer Trial | `command-r-plus`, `command-r` |
| **NVIDIA NIM** | `nvidia` | [build.nvidia.com](https://build.nvidia.com) | 1,000 free inference credits | `deepseek-ai/deepseek-r1`, `llama-3.3-70b` |
| **Hyperbolic** | `hyperbolic` | [app.hyperbolic.xyz](https://app.hyperbolic.xyz) | Free community tier | `meta-llama/Llama-3.3-70B-Instruct` |
| **AIML API** | `aimlapi` | [aimlapi.com](https://aimlapi.com) | Free trial tokens | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| **Chutes AI** | `chutes` | [chutes.ai](https://chutes.ai) | Free serverless tier | `deepseek-ai/DeepSeek-V3`, `DeepSeek-R1` |

---

## 6. Flagship Frontier & Reasoning Models

| Provider | Adapter ID | Portal Link | Key Models |
|---|---|---|---|
| **DeepSeek Official** | `deepseek` | [platform.deepseek.com](https://platform.deepseek.com) | `deepseek-chat` (V3), `deepseek-reasoner` (R1) |
| **SiliconFlow** | `siliconflow` | [cloud.siliconflow.cn](https://cloud.siliconflow.cn) | `Qwen/Qwen2.5-7B-Instruct`, DeepSeek Distill |
| **Zhipu AI** | `zhipu` | [open.bigmodel.cn](https://open.bigmodel.cn) | `glm-4-flash` (100% Free Forever) |
| **Moonshot AI (Kimi)** | `moonshot` | [platform.moonshot.cn](https://platform.moonshot.cn) | `moonshot-v1-8k`, `moonshot-v1-32k` |
| **Alibaba DashScope** | `dashscope` | [bailian.console.aliyun.com](https://bailian.console.aliyun.com) | `qwen-plus`, `qwen2.5-coder-32b-instruct` |
| **MiniMax** | `minimax` | [platform.minimaxi.com](https://platform.minimaxi.com) | `abab6.5s-chat` |
| **01.AI (Yi)** | `lingyiwanwu` | [platform.lingyiwanwu.com](https://platform.lingyiwanwu.com) | `yi-large`, `yi-lightning` |
| **StepFun** | `stepfun` | [platform.stepfun.com](https://platform.stepfun.com) | `step-1-8k`, `step-2-16k` |
| **iFlytek Spark** | `iflytek` | [xinghuo.xfyun.cn](https://xinghuo.xfyun.cn) | `lite` (Free Forever), `v3.5` |
| **ByteDance Volcengine** | `volcengine` | [console.volcengine.com](https://console.volcengine.com) | `doubao-lite-4k`, `doubao-pro-4k` |
| **Baidu Qianfan** | `qianfan` | [console.bce.baidu.com](https://console.bce.baidu.com) | `ernie-speed-8k`, `ernie-lite-8k` |
| **Baichuan AI** | `baichuan` | [platform.baichuan-ai.com](https://platform.baichuan-ai.com) | `Baichuan4`, `Baichuan3-Turbo` |
| **Tencent Hunyuan** | `hunyuan` | [cloud.tencent.com](https://cloud.tencent.com) | `hunyuan-large`, `hunyuan-standard`, `hunyuan-code` |
| **SenseTime SenseNova** | `sensenova` | [platform.sensenova.cn](https://platform.sensenova.cn) | `SenseChat-5`, `SenseChat-5-Cantonese` |

---

## 7. European Sovereign & Specialized Cloud AI

| Provider | Adapter ID | Portal Link | Key Highlights |
|---|---|---|---|
| **Scaleway** | `scaleway` | [console.scaleway.com](https://console.scaleway.com) | European GDPR Cloud: `llama-3.3-70b`, `deepseek-r1` |
| **OVHcloud** | `ovhcloud` | [endpoints.kepler.ai.cloud.ovh.net](https://endpoints.kepler.ai.cloud.ovh.net) | Sovereign EU Cloud: `Meta-Llama-3-1-70B` |
| **IBM watsonx.ai** | `watsonx` | [cloud.ibm.com](https://cloud.ibm.com) | Enterprise Granite: `ibm/granite-3-8b-instruct` |
| **Google Cloud Vertex** | `vertex` | [console.cloud.google.com/vertex-ai](https://console.cloud.google.com) | $300 trial credit: `gemini-1.5-pro` |
| **Nebius AI Studio** | `nebius` | [studio.nebius.ai](https://studio.nebius.ai) | H100 NVLink Cluster: `meta-llama/Llama-3.3-70B` |
| **Friendli AI** | `friendli` | [suite.friendli.ai](https://suite.friendli.ai) | Ultra low TTFT: `meta-llama-3.1-70b-instruct` |
| **Featherless AI** | `featherless` | [featherless.ai](https://featherless.ai) | 1,000+ open fine-tunes on demand |
| **Replicate** | `replicate` | [replicate.com](https://replicate.com) | Cloud serverless open models |
| **Baseten** | `baseten` | [app.baseten.co](https://app.baseten.co) | High-throughput serverless Truss deployments |
| **Segmind** | `segmind` | [segmind.com](https://segmind.com) | 100 free requests/day forever: `llama-3-8b` |
| **NLP Cloud** | `nlpcloud` | [nlpcloud.com](https://nlpcloud.com) | 1 free req/min permanent: `finetuned-llama-3-70b` |
| **Poe API** | `poe` | [poe.com](https://poe.com) | Multi-bot ecosystem: `Claude-3.5-Sonnet`, `GPT-4o-Mini` |
| **Lepton AI** | `lepton` | [dashboard.lepton.ai](https://dashboard.lepton.ai) | 500+ tok/s: `llama3-3-70b`, `deepseek-r1` |
| **Inference.net** | `inference_net` | [inference.net](https://inference.net) | Open community compute: `deepseek-r1` |
| **GMI Cloud** | `gmicloud` | [gmicloud.ai](https://gmicloud.ai) | Enterprise GPUs: `qwen-2.5-coder-32b` |
| **xAI Grok** | `xai` | [console.x.ai](https://console.x.ai) | Flagship Grok: `grok-2-1212`, `grok-2-vision-1212` |
| **Perplexity AI** | `perplexity` | [perplexity.ai](https://perplexity.ai) | Live search: `sonar`, `sonar-reasoning` |
| **Reka AI** | `reka` | [chat.reka.ai](https://chat.reka.ai) | Multimodal: `reka-core`, `reka-flash` |
| **AI21 Labs** | `ai21` | [studio.ai21.com](https://studio.ai21.com) | Mamba Architecture: `jamba-1.5-large`, `jamba-1.5-mini` |
| **Writer** | `writer` | [dev.writer.com](https://dev.writer.com) | Enterprise Palmyra: `palmyra-x-004` |
| **Voyage AI** | `voyage` | [dash.voyageai.com](https://dash.voyageai.com) | 50M Free Tokens: `voyage-3`, `voyage-code-3` |
| **Jina AI** | `jina` | [jina.ai](https://jina.ai) | 10M Free Tokens: `jina-embeddings-v3` |

---

## 8. Virtual Auto-Combos & Routing Tags

Instead of hardcoding a single vendor, call one of our resilient virtual combos with built-in instant failover:

| Virtual Combo | Alias Tag | Description | Primary Targets |
|---|---|---|---|
| `extra/frontier` | `#frontier`, `#paid` | Flagship frontier cascade | Anthropic Claude 3.7 Sonnet → OpenAI GPT-4o → Kilo Claude 3.7 → Puter Claude 3.7 → Blackbox Claude 3.5 → ShuttleAI → Upstage Solar Pro |
| `extra/auto-free` | `#free`, `auto` | Best free model cascade | DeepSeek-V3 → Groq Llama 3.3 70B → SambaNova → DuckDuckGo → Blackbox → Gemini 2.0 Flash |
| `extra/free-coding` | `#coding` | Code specialist cascade | Mistral Codestral → Blackbox Coder → DeepSeek-V3 → Qwen 2.5 Coder 32B → Llama 3.3 70B |
| `extra/free-fast` | `#fast` | Sub-second LPU speed | Cerebras LPU → Groq LPU → DuckDuckGo → Upstage Solar Mini → Spark Lite |
| `extra/free-reasoning` | `#reasoning` | Deep chain-of-thought | DeepSeek-R1 → Perplexity Sonar Reasoning → Step-2 → Scaleway R1 → Lepton R1 |
| `extra/free-vision` | `#vision` | Multimodal vision & OCR | Gemini 2.0 Flash → Grok 2 Vision → Reka Flash → Step-1 |

---

## 9. Quick Integration Code Snippets

### Python (OpenAI SDK)
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="elx-live-master-free-hub"
)

# Route to frontier paid & zero-key models
response = client.chat.completions.create(
    model="extra/frontier",
    messages=[{"role": "user", "content": "Write a distributed raft consensus algorithm in Rust."}]
)
print(response.choices[0].message.content)
```

### Node.js / TypeScript
```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'elx-live-master-free-hub',
});

const stream = await client.chat.completions.create({
  model: 'extra/frontier',
  messages: [{ role: 'user', content: 'Explain quantum entanglement.' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### Cursor / Cline / Roo Code / LibreChat
- **API Base URL**: `http://localhost:3000/v1`
- **API Key**: `elx-live-master-free-hub`
- **Model**: `extra/frontier` or `extra/free-coding` or direct prefixed model (e.g. `kilo/claude-3-7-sonnet`, `anthropic/claude-3-7-sonnet-20250219`, `openai/gpt-4o`).
