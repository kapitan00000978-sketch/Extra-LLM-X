# Extra LLM X — Complete 24+ Free Provider Guide

This guide provides step-by-step instructions on how to obtain 100% free API keys from all supported AI providers. Extra LLM X requires **$0 expenditure**. Every provider listed below offers either a permanent free tier or substantial free developer starter credits.

---

## Quick Reference Summary Table

| Provider | Portal Link | Free Quota | Key Prefix | Popular Free Models |
|---|---|---|---|---|
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) | 15 RPM / 1,500 RPD free forever | `AIzaSy` | `gemini-2.0-flash`, `gemini-1.5-flash` |
| **Groq Cloud** | [console.groq.com/keys](https://console.groq.com/keys) | 30 RPM, 14,400 RPD free forever | `gsk_` | `llama-3.3-70b-versatile`, `qwen-2.5-32b` |
| **DeepSeek Official** | [platform.deepseek.com](https://platform.deepseek.com/api_keys) | 5M Free Tokens on Signup | `sk-` | `deepseek-chat` (V3), `deepseek-reasoner` (R1) |
| **Cerebras Cloud** | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | 30 RPM, 1M tok/day (2000 tok/s) | `csk-` | `llama-3.3-70b`, `llama3.1-8b` |
| **SambaNova Cloud** | [cloud.sambanova.ai](https://cloud.sambanova.ai/) | Generous free developer tier | `*` | `DeepSeek-R1`, `Meta-Llama-3.3-70B` |
| **GitHub Models** | [github.com/settings/tokens](https://github.com/settings/tokens) | 150 req/day free via Personal Token | `ghp_` | `gpt-4o`, `gpt-4o-mini`, `Phi-4` |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) | Unlimited access to `:free` models | `sk-or-` | 40+ free models auto-discovered |
| **Hyperbolic** | [app.hyperbolic.xyz](https://app.hyperbolic.xyz/settings) | Free serverless compute tier | `*` | `meta-llama/Llama-3.3-70B-Instruct` |
| **Mistral AI** | [console.mistral.ai](https://console.mistral.ai/api-keys/) | 1 req/sec free (Codestral) | `*` | `codestral-latest`, `mistral-small` |
| **NVIDIA NIM** | [build.nvidia.com](https://build.nvidia.com/) | 1,000 Free Inference Credits | `nvapi-` | `deepseek-ai/deepseek-r1`, `llama-3.3-70b` |
| **SiliconFlow** | [cloud.siliconflow.cn](https://cloud.siliconflow.cn/account/ak) | Permanent free tier for open models | `sk-` | `Qwen/Qwen2.5-7B-Instruct`, DeepSeek Distill |
| **Zhipu AI** | [open.bigmodel.cn](https://open.bigmodel.cn/usercenter/apikeys) | GLM-4-Flash 100% Free Forever | `*` | `glm-4-flash` |
| **AIML API** | [aimlapi.com](https://aimlapi.com/app/keys) | Free starter credits (100+ models) | `*` | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| **Chutes AI** | [chutes.ai](https://chutes.ai/) | Free serverless community tier | `*` | `deepseek-ai/DeepSeek-V3`, `DeepSeek-R1` |
| **Hugging Face** | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) | Free Serverless Inference API | `hf_` | `Qwen/Qwen2.5-Coder-32B-Instruct` |
| **Together AI** | [api.together.xyz](https://api.together.xyz/settings/api-keys) | $5.00 free developer credits | `*` | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| **Cloudflare** | [dash.cloudflare.com](https://dash.cloudflare.com/) | 10,000 neurons/day free tier | `*` | `@cf/meta/llama-3.3-70b-instruct` |
| **Fireworks AI** | [fireworks.ai](https://fireworks.ai/api-keys) | Free trial developer credits | `*` | `accounts/fireworks/models/llama-v3p3-70b` |
| **DeepInfra** | [deepinfra.com](https://deepinfra.com/dash/api_keys) | Free trial tier for open weights | `*` | `meta-llama/Meta-Llama-3.1-8B-Instruct` |
| **Novita AI** | [novita.ai](https://novita.ai/settings/key-management) | Free trial credits | `*` | `meta-llama/llama-3.3-70b-instruct` |
| **Cohere** | [dashboard.cohere.com](https://dashboard.cohere.com/api-keys) | Free developer trial key | `*` | `command-r-plus`, `command-r` |
| **Ollama** | [ollama.com](https://ollama.com/) | 100% Local / Offline / Zero-cost | None | Local models on `localhost:11434` |
| **LM Studio** | [lmstudio.ai](https://lmstudio.ai/) | 100% Local / Offline / Zero-cost | None | Local models on `localhost:1234` |
| **Mock Demo** | Built-in | Simulated zero-key playground | `mock` | `extra-demo-model` (instant test) |

---

## Detailed Provider Walkthroughs

### 1. Google Gemini (Google AI Studio)
- **Portal:** [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Quota:** 15 Requests Per Minute (RPM), 1,500 Requests Per Day (RPD), 1,000,000 token context window.
- **How to Get:**
  1. Go to Google AI Studio and sign in with any standard Google account.
  2. Click **Get API key** in the left navigation sidebar.
  3. Click **Create API key** (create in new or existing GCP project).
  4. Copy the key starting with `AIzaSy...`.
  5. In Extra LLM X Dashboard, select **Gemini** and click **+ Add Key**.

### 2. Groq Cloud
- **Portal:** [https://console.groq.com/keys](https://console.groq.com/keys)
- **Quota:** 30 RPM, 14,400 requests/day, ultra-fast 500+ tok/s LPU inference.
- **How to Get:**
  1. Navigate to Groq Console and sign in via Google or GitHub.
  2. Select **API Keys** from the sidebar menu.
  3. Click **Create API Key**, enter any label (e.g. `ExtraLLMX`).
  4. Copy key starting with `gsk_...`.
  5. In Extra LLM X Dashboard, select **Groq** and add your key.

### 3. DeepSeek Official
- **Portal:** [https://platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- **Quota:** 5,000,000 free tokens on initial signup.
- **Models:** `deepseek-chat` (DeepSeek-V3), `deepseek-reasoner` (DeepSeek-R1 native chain-of-thought).
- **How to Get:**
  1. Sign up on DeepSeek Platform using email or phone.
  2. Confirm your free 5M token quota in the balance overview.
  3. Go to **API Keys** -> **Create API Key**.
  4. Copy key starting with `sk-...`.
  5. Paste into Extra LLM X Dashboard under **DeepSeek**.

### 4. Cerebras Cloud
- **Portal:** [https://cloud.cerebras.ai/](https://cloud.cerebras.ai/)
- **Quota:** 30 RPM, 1,000,000 tokens/day, world-record 2,000+ tok/s CS-3 wafer scale speed.
- **How to Get:**
  1. Create a free account on Cerebras Cloud.
  2. Click **API Keys** in the dashboard navigation.
  3. Generate a new key starting with `csk-...`.
  4. Paste into Extra LLM X Dashboard under **Cerebras**.

### 5. SambaNova Cloud
- **Portal:** [https://cloud.sambanova.ai/](https://cloud.sambanova.ai/)
- **Quota:** High throughput SN40L inference hosting DeepSeek-R1 and Llama 3.3 70B.
- **How to Get:**
  1. Sign in to SambaNova Cloud.
  2. Navigate to **APIs & Keys**.
  3. Generate your developer key and add it to Extra LLM X.

### 6. GitHub Models (Azure AI)
- **Portal:** [https://github.com/settings/tokens](https://github.com/settings/tokens)
- **Quota:** 150 requests/day free per GitHub Personal Access Token (PAT).
- **Models:** `gpt-4o`, `gpt-4o-mini`, `Phi-4`, `Llama-3.3-70B`.
- **How to Get:**
  1. Open GitHub Settings -> **Developer Settings** -> **Personal Access Tokens (classic)**.
  2. Click **Generate new token (classic)**. No scopes are strictly required for Azure AI Inference.
  3. Copy the token starting with `ghp_...`.
  4. Paste into Extra LLM X under **GitHub Models**.

### 7. Zhipu AI (GLM-4-Flash)
- **Portal:** [https://open.bigmodel.cn/usercenter/apikeys](https://open.bigmodel.cn/usercenter/apikeys)
- **Quota:** 100% Free Forever for GLM-4-Flash with 128k context.
- **How to Get:**
  1. Register on BigModel Open Platform.
  2. Generate API key from the user center.
  3. Add to Extra LLM X under **Zhipu**.

### 8. SiliconFlow
- **Portal:** [https://cloud.siliconflow.cn/account/ak](https://cloud.siliconflow.cn/account/ak)
- **Quota:** Permanent free tier on open-source models (Qwen 2.5 7B, DeepSeek-R1-Distill).
- **How to Get:**
  1. Sign up on SiliconFlow Cloud.
  2. Copy developer key from Account API Keys.
  3. Add to Extra LLM X under **SiliconFlow**.

### 9. Ollama & LM Studio (Localhost Offline)
- **Ollama:** Download from [ollama.com](https://ollama.com/). Run `ollama run llama3.2`. Extra LLM X automatically detects `http://127.0.0.1:11434`.
- **LM Studio:** Download from [lmstudio.ai](https://lmstudio.ai/). Start local server on port 1234. Extra LLM X automatically detects `http://127.0.0.1:1234`.

---

## Multi-Key Load Balancing & Rotation
Extra LLM X supports adding **multiple keys per provider**. If you have 3 Groq keys or 4 Gemini keys:
1. Extra LLM X will automatically rotate through them using least-recently-used (LRU) scheduling.
2. If Key #1 hits a rate limit (HTTP 429), it automatically cools down Key #1 and routes the next call to Key #2 with zero downtime.
