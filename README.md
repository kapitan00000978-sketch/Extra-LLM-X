# ⚡ Extra LLM X - Zero-Cost AI Gateway & Provider Orchestrator

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/Tests-92%2F92%20Passing-brightgreen.svg" alt="Tests" />
  <img src="https://img.shields.io/badge/Free%20Capacity-5B%2B%20Tokens%2FMonth-gold.svg" alt="Free Capacity" />
  <img src="https://img.shields.io/badge/Native%20Adapters-80%2B%20Built--In-purple.svg" alt="Native Adapters" />
  <img src="https://img.shields.io/badge/Directory-500%2B%20Models-cyan.svg" alt="500+ Models" />
  <img src="https://img.shields.io/badge/API-OpenAI%20v1%20Parity-green.svg" alt="OpenAI API Parity" />
  <img src="https://img.shields.io/badge/CLI-Single%20Command%20`extra--llm`-red.svg" alt="CLI extra-llm" />
</p>

```
  ==============================================================
   -------·--·  --·--------·------·  -----·     --·     --·     ---·   ---·    --·  --·
   --·====-L--·--·-L==--·==---·==--·--·==--·    --·     --·     ----· ----·    L--·--·-
   -----·   L---·-    --·   ------·--------·    --·     --·     --·----·--·     L---·- 
   --·==-   --·--·    --·   --·==--·--·==--·    --·     --·     --·L--·---·     --·--· 
   -------·--·- --·   --·   --·  --·--·  --·    -------·-------·--· L=- --·    --·- --·
   L======-L=-  L=-   L=-   L=-  L=-L=-  L=-    L======-L======-L=-     L=-    L=-  L=-
  ==============================================================
   ⚡ EXTRA LLM X - 100% FREE MULTI-PROVIDER AI GATEWAY & HUB ⚡
  ==============================================================
```

**Extra LLM X** is a high-throughput, standalone AI Gateway and Model Orchestrator that pools **80+ native AI adapters and 500+ free models** into a single unified, OpenAI-compatible endpoint. It provides **5 Billion+ Free Tokens/Month** of aggregate compute with sub-millisecond failover, dynamic load balancing, automated model discovery, tool calling polyfills, code sandbox execution, web search grounding, and full multimodal support—at **$0 infrastructure cost**.

---

## ⚡ Single Command CLI Execution (`extra-llm` / `extra`)

Extra LLM X can be launched or controlled with **a single command** globally from anywhere in your terminal (PowerShell, Command Prompt, macOS/Linux Bash/Zsh):

### 1. Global Setup (Run once)
```bash
npm link
# or
npm install -g .
```

### 2. Single Command Usage
```bash
# Start Gateway & Web Control Hub (Port 3000)
extra-llm

# Short alias:
extra

# Check gateway status and uptime
extra status

# Instantly generate a 100% working random API Key:
extra-llm key new "my-app"

# View Virtual Routing Combos
extra combos

# List 80+ native providers & popular models
extra models

# CLI help
extra-llm --help
```

> 📖 **Full CLI Documentation:** See [`docs/CLI_GUIDE.md`](docs/CLI_GUIDE.md) for detailed CLI commands, options, and automation examples.

---

## 🏗️ System Architecture & Workflow

The following Mermaid diagram illustrates how **Extra LLM X** processes client requests, applies rate-limiting, semantic caching, speculative hedging, and intelligent failover routing across 80+ native providers:

```mermaid
flowchart TD
    Client["Client Request\n(Cursor / Claude Code / Python SDK / Web UI / LangChain)"] --> Gateway["Extra LLM X Gateway (Port 3000)"]
    
    Gateway --> Auth["Authentication & Key Validation\n(Bearer System Token)"]
    Auth --> Guard["Capability Guard & Moderation\n(Model Router & Safety Check)"]
    
    Guard --> CacheCheck{"Semantic Cache\n(L1 Memory / L2 SQLite)?"}
    CacheCheck -- "Cache Hit (0ms)" --> Response["Return Cached Response\n(SSE Stream / JSON)"]
    
    CacheCheck -- "Cache Miss" --> Router["Intelligent Model Router & Fallback Chain"]
    
    Router --> Hedging{"Speculative Hedging\nEnabled (>3.8s)?"}
    
    Hedging -- Yes --> ParallelRace["Race Primary & Secondary\nFastest Response Wins"]
    Hedging -- No --> DirectExec["Execute Primary Selected Provider"]
    
    subgraph ProviderPool ["80+ Native Free Providers & 500+ Model Hub"]
        P1["Groq & Cerebras (LPU 500-2000 tok/s)"]
        P2["Google AI Studio & Vertex AI"]
        P3["DeepSeek Official (V3 / R1)"]
        P4["xAI Grok & Perplexity AI"]
        P5["SambaNova Cloud (SN40L) & Nebius H100"]
        P6["Alibaba DashScope (Qwen) & Baidu Qianfan"]
        P7["Moonshot Kimi, MiniMax, StepFun, 01.AI Yi"]
        P8["iFlytek Spark, ByteDance Volcengine (Doubao)"]
        P9["Reka AI, AI21 Labs (Jamba), Writer (Palmyra)"]
        P10["GitHub Models, Mistral AI & Hugging Face"]
        P11["OpenRouter, SiliconFlow & Zhipu GLM-4"]
        P12["Scaleway, OVHcloud, Friendli, Featherless"]
        P13["Replicate, Baseten, Segmind, NLP Cloud, Poe, Lepton"]
        P14["Embeddings: Voyage AI & Jina AI"]
        P15["Zero-Key: Puter, Pollinations, OpenCode, Kilo"]
        P16["Paid & Frontier: OpenAI, Anthropic, DeepSeek, Gemini Pro"]
        P17["Local: Ollama & LM Studio"]
    end
    
    DirectExec --> ProviderPool
    ParallelRace --> ProviderPool
    
    ProviderPool --> RateLimitCheck{"Rate Limit / Timeout\nEncountered?"}
    RateLimitCheck -- "Yes (429/503)" --> Failover["Auto Circuit Breaker\nCooldown Key & Rotate Next Provider"]
    Failover --> Router
    
    RateLimitCheck -- "No (Success 200 OK)" --> ResponseHandler["Response Stream Processor\n(Token Counter & L1/L2 Cache Store)"]
    ResponseHandler --> Response

    subgraph AuxiliaryServices ["Multimodal & Utility Micro-Services"]
        E1["Vector Embeddings (1536-dim / Voyage / Jina)"]
        E2["Image Generation (Flux / SDXL / Segmind)"]
        E3["Audio Transcription (Whisper Large)"]
        E4["Live Web Search Grounding"]
        E5["Isolated Code Sandbox (JS/Python)"]
        E6["Tool/Function Calling Polyfill"]
    end
```

---

## 🌟 Key Features

1. **80+ Native Production Adapters & 500+ Curated Models:**
   - Dedicated adapters for xAI (Grok), Perplexity, Moonshot (Kimi), Alibaba DashScope, MiniMax, 01.AI, StepFun, iFlytek, Doubao, ERNIE, Reka, AI21, Writer, Voyage, Jina, watsonx, Vertex, Nebius, Scaleway, OVHcloud, Friendli, Featherless, Replicate, Baseten, Segmind, NLP Cloud, Poe, Inference.net, GMI Cloud, Lepton, Kilo, Puter, OpenAI, and Anthropic.
2. **Instant 100% Working Random API Keys:**
   - Generate working system keys directly from CLI (`extra-llm key new`) or the Web UI with 1-click. All keys are verified and stored in SQLite database.
3. **5 Billion+ Free Tokens/Month Aggregate Pool:**
   - Combines official free developer quotas into one centralized pool with smart multi-key rotation and cooldown handling.
4. **Autonomous Sub-Millisecond Failover:**
   - If a provider encounters a rate limit (HTTP 429) or error, Extra LLM X immediately routes to the next equivalent model in the chain.
5. **Zero-Key Out-Of-The-Box Mode:**
   - Works immediately without any setup or third-party keys using Puter.js, Pollinations.ai, OpenCode Free, and demo fallbacks.

---

## 🚀 Quick Start

### 1. One-Click Global CLI
```bash
npm link
extra-llm
```

### 2. Standard Start
```bash
git clone https://github.com/kapitan00000978-sketch/Extra-LLM-X.git
cd Extra-LLM-X
npm install
npm start
```
Open `http://localhost:3000` to access the Web Control Hub.

---

## 🔀 Virtual Model Combos

Route to smart virtual combos for automatic fallback and maximum availability:

| Combo Name | Target Specialization | Fallback Chain |
| :--- | :--- | :--- |
| **`extra/auto-free`** | General Purpose & High Quality | DeepSeek $\to$ Groq $\to$ SambaNova $\to$ xAI $\to$ Perplexity $\to$ DashScope $\to$ Nebius $\to$ Gemini $\to$ Moonshot $\to$ MiniMax $\to$ Yi $\to$ StepFun $\to$ Scaleway $\to$ Lepton |
| **`extra/free-coding`** | Code Generation & Debugging | Codestral $\to$ DeepSeek-V3 $\to$ Qwen 2.5 Coder $\to$ Nebius $\to$ GMI Cloud $\to$ Lepton $\to$ IBM Granite $\to$ Baseten $\to$ Llama 3.3 |
| **`extra/fast-chat`** | Sub-Second / Fast Operations | Cerebras Llama 8B $\to$ Groq Llama 8B $\to$ iFlytek Spark Lite $\to$ ERNIE Speed $\to$ Segmind $\to$ Jamba 1.5 Mini $\to$ Doubao Lite |
| **`extra/deep-reasoning`** | Deep Reasoning, Logic & Math | DeepSeek-R1 $\to$ Perplexity Sonar Reasoning $\to$ Step-2 $\to$ Scaleway R1 $\to$ Lepton R1 $\to$ Inference.net R1 $\to$ SambaNova R1 |
| **`extra/creative`** | Artistic Writing & Brainstorming | Claude 3.5 Sonnet $\to$ Mistral Large $\to$ Qwen 2.5 72B $\to$ GLM-4 $\to$ Llama 3.3 |
| **`extra/frontier`** | Frontier Class Models | Claude 3.5 Sonnet $\to$ GPT-4o $\to$ DeepSeek V3 $\to$ Gemini 2.0 Flash |

---

## 🔌 Integration Guide

### 1. Python OpenAI SDK
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="elx-live-master-free-hub"  # Or key generated via `extra-llm key new`
)

# Chat Completion with Streaming
response = client.chat.completions.create(
    model="extra/auto-free",
    messages=[{"role": "user", "content": "Explain asynchronous programming in Python."}],
    stream=True
)

for chunk in response:
    content = chunk.choices[0].delta.content or ""
    print(content, end="", flush=True)
```

### 2. Cursor IDE / Cline / Claude Code / Roo Code / Aider
Configure OpenAI compatible provider:
- **Base URL:** `http://localhost:3000/v1`
- **API Key:** `elx-live-master-free-hub` (or key from `extra-llm key new`)
- **Model ID:** `extra/free-coding` or `extra/auto-free`

### 3. cURL Request
```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer elx-live-master-free-hub" \
  -d '{
    "model": "extra/auto-free",
    "messages": [{"role": "user", "content": "Hello Extra LLM X!"}]
  }'
```

---

## 🧪 Testing & Diagnostics

Run the full automated test suite:
```bash
npm test
```
```
✔ AdapterRegistry: registers all 80+ adapters
✔ CLI Runner: extra-llm binary executes cleanly and manages keys
✔ Auto-Discovery Pipeline: validates live keys and scans models
✔ Speculative Hedging Engine: races primary and fallback candidates
✔ 92/92 tests passing (0 failures)
```

Live provider health check:
```bash
npm run health
```

---

## 📄 License
Released under the [MIT License](LICENSE). Free for personal and commercial use.
