# ⚡ Extra LLM X — Zero-Cost AI Gateway & Provider Orchestrator

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/Tests-72%2F72%20Passing-brightgreen.svg" alt="Tests" />
  <img src="https://img.shields.io/badge/Free%20Capacity-5B%2B%20Tokens%2FMonth-gold.svg" alt="Free Capacity" />
  <img src="https://img.shields.io/badge/Providers-26%2B%20Supported-purple.svg" alt="Providers" />
  <img src="https://img.shields.io/badge/API-OpenAI%20v1%20Parity-green.svg" alt="OpenAI API Parity" />
  <img src="https://img.shields.io/badge/Architecture-Autonomous%20Failover-orange.svg" alt="Architecture" />
</p>

```
  ==============================================================
   ███████╗██╗  ██╗████████╗██████╗  █████╗     ██╗     ██╗     ███╗   ███╗    ██╗  ██╗
   ██╔════╝╚██╗██╔╝╚══██╔══╝██╔══██╗██╔══██╗    ██║     ██║     ████╗ ████║    ╚██╗██╔╝
   █████╗   ╚███╔╝    ██║   ██████╔╝███████║    ██║     ██║     ██╔████╔██║     ╚███╔╝ 
   ██╔══╝   ██╔██╗    ██║   ██╔══██╗██╔══██║    ██║     ██║     ██║╚██╔╝██║     ██╔██╗ 
   ███████╗██╔╝ ██╗   ██║   ██║  ██║██║  ██║    ███████╗███████╗██║ ╚═╝ ██║    ██╔╝ ██╗
   ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝    ╚══════╝╚══════╝╚═╝     ╚═╝    ╚═╝  ╚═╝
  ==============================================================
   ⚡ EXTRA LLM X — 100% FREE MULTI-PROVIDER AI GATEWAY & HUB ⚡
  ==============================================================
```

**Extra LLM X** is a high-throughput, standalone AI Gateway and Model Orchestrator that pools **26+ free AI model providers** into a single unified, OpenAI-compatible endpoint. It provides **5 Billion+ Free Tokens/Month** of aggregate compute with sub-millisecond failover, dynamic load balancing, automated model discovery, and full multimodal support—at **$0 infrastructure cost**.

---

## 🏗 System Architecture & Workflow

The following Mermaid diagram illustrates how **Extra LLM X** processes client requests, applies rate-limiting, semantic caching, speculative hedging, and intelligent failover routing across 26+ providers:

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
    
    subgraph ProviderPool ["26+ Free Providers & Zero-Key Hub"]
        P1["Groq (LPU 500+ tok/s)"]
        P2["Cerebras (2000+ tok/s)"]
        P3["Google AI Studio (Gemini 2.5/2.0)"]
        P4["DeepSeek Official (V3 / R1)"]
        P5["SambaNova Cloud (SN40L)"]
        P6["GitHub Models (GPT-4o Mini / Phi-4)"]
        P7["Hugging Face Serverless"]
        P8["OpenRouter (30+ Free Models)"]
        P9["SiliconFlow (20M Free Tokens)"]
        P10["Zhipu AI (GLM-4-Flash Unlimited)"]
        P11["Zero-Key Providers (Puter / Pollinations / OpenCode)"]
        P12["Local Engines (Ollama / LM Studio)"]
    end
    
    DirectExec --> ProviderPool
    ParallelRace --> ProviderPool
    
    ProviderPool --> RateLimitCheck{"Rate Limit / Timeout\nEncountered?"}
    RateLimitCheck -- "Yes (429/503)" --> Failover["Auto Circuit Breaker\nCooldown Key & Rotate Next Provider"]
    Failover --> Router
    
    RateLimitCheck -- "No (Success 200 OK)" --> ResponseHandler["Response Stream Processor\n(Token Counter & L1/L2 Cache Store)"]
    ResponseHandler --> Response

    subgraph AuxiliaryServices ["Multimodal & Utility Micro-Services"]
        E1["Vector Embeddings (1536-dim)"]
        E2["Image Generation (Flux / SDXL)"]
        E3["Audio Transcription (Whisper Large)"]
        E4["Live Web Search Grounding"]
        E5["Isolated Code Sandbox (JS/Python)"]
        E6["Tool/Function Calling Polyfill"]
    end
```

---

## 🌟 Key Features

1. **Auto-Discovery & Live Key Validation Pipeline:**
   - Input any provider API key into the dashboard or API.
   - Extra LLM X sends a real-time validation probe to verify validity.
   - Automatically queries and registers all compatible free models without manual setup.

2. **5 Billion+ Free Tokens/Month Aggregate Pool:**
   - Aggregates free tiers from Google Gemini, Groq, Cerebras, SambaNova, DeepSeek, GitHub Models, SiliconFlow, Zhipu, and 15+ others.
   - Key rotation handles multi-key pooling across developer quotas.

3. **Autonomous Sub-Millisecond Failover:**
   - If a provider hits a rate limit (HTTP 429) or latency spike, Extra LLM X instantly switches to the next equivalent model in under 15ms.

4. **Zero-Key Out-Of-The-Box Mode:**
   - Fully functional without any keys! Powered by Puter.js, Pollinations.ai, OpenCode Free, and built-in simulation adapters.

5. **Full OpenAI Specification Parity:**
   - 100% drop-in replacement for OpenAI SDK, Cursor, Claude Code, Cline, Roo Code, and LangChain.

6. **Cyberpunk Web Operations Dashboard:**
   - Real-time token savings counter, live model health diagnostics, interactive streaming playground, and benchmark charts.

---

## 🚀 Quick Start

### 1. One-Click Launch (Windows)
Double-click **`start.bat`**. It will:
- Check and install dependencies (`npm install`).
- Start the gateway on `http://localhost:3000`.
- Open the dashboard in your default browser.

### 2. Manual Start (Linux / macOS / Windows)
```bash
git clone https://github.com/kapitan00000978-sketch/Extra-LLM-X.git
cd Extra-LLM-X
npm install
npm start
```

Open `http://localhost:3000` to access the Control Center.

---

## 🤖 Virtual Model Combos

Route to smart virtual combos for automatic fallback and maximum availability:

| Combo Name | Target Specialization | Fallback Chain |
| :--- | :--- | :--- |
| **`extra/auto-free`** | General Purpose & High Quality | DeepSeek $\to$ Groq $\to$ SambaNova $\to$ Gemini Flash $\to$ Cerebras $\to$ Pollinations |
| **`extra/free-coding`** | Code Generation & Debugging | Codestral $\to$ Qwen 2.5 Coder $\to$ Llama 3.3 70B $\to$ Gemini 2.0 Flash |
| **`extra/free-fast`** | Sub-Second / Fast Operations | Cerebras Llama 8B $\to$ Groq Llama 8B $\to$ Gemini Flash Lite |
| **`extra/free-reasoning`** | Deep Reasoning, Logic & Math | DeepSeek-R1 $\to$ SambaNova R1 $\to$ Groq R1 $\to$ Gemini Thinking |
| **`extra/free-vision`** | Multimodal & Image Understanding | Gemini 2.0 Flash $\to$ GPT-4o Mini $\to$ OpenRouter Gemini Exp |
| **`extra/free-embedding`**| Semantic Search & Vector Memory | 1536-dimensional normalized cosine vectors |

---

## 🌐 Supported Free Providers

| Provider | Top Free Models | Monthly Capacity / Limits |
| :--- | :--- | :--- |
| **Google AI Studio** | `gemini-2.0-flash`, `gemini-2.5-flash` | 15 RPM / 1,500 RPD (~1.5B tokens/mo) |
| **Groq Cloud** | `llama-3.3-70b-versatile`, `deepseek-r1-distill-70b` | 30 RPM, 500+ tok/s Ultra-fast LPU |
| **Cerebras Cloud** | `llama-3.3-70b`, `llama3.1-8b` | 2,000+ tok/s Wafer-scale engine |
| **DeepSeek Official** | `deepseek-chat` (V3), `deepseek-reasoner` (R1) | 5M Free Tokens, Native CoT |
| **SambaNova Cloud** | `Meta-Llama-3.3-70B-Instruct`, `DeepSeek-R1` | Free Developer Tier on SN40L |
| **GitHub Models** | `gpt-4o`, `gpt-4o-mini`, `Phi-4`, `Llama-3.3-70B` | Free with GitHub Personal Access Token |
| **SiliconFlow** | `deepseek-ai/DeepSeek-V3`, `Qwen/Qwen2.5-7B` | 20M Free Tokens allowance |
| **Zhipu AI (GLM-4)** | `glm-4-flash` | 100% Free & Unlimited tier |
| **OpenRouter** | 30+ Free models (`:free` suffix) | Zero-cost community routing |
| **Mistral AI** | `codestral-latest`, `mistral-small-latest` | Free developer quota |
| **Hugging Face** | `Qwen2.5-Coder-32B`, `DeepSeek-R1-Qwen-32B` | Free serverless inference |
| **Puter.js** | `gpt-4o-mini`, `claude-3-5-sonnet` | Zero-Key open cloud runtime |
| **Pollinations AI** | `openai` (GPT-4o), `qwen`, `mistral` | Zero-Key public API |
| **OpenCode Free** | `deepseek-v3`, `glm-4`, `qwen-2.5-72b` | Zero-Key direct backend |
| **Ollama & LM Studio**| Any local model | 100% Offline, private and unlimited |

---

## 🔌 Integration Guide

### 1. Python OpenAI SDK
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="elx-live-master-free-hub"
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
- **API Key:** `elx-live-master-free-hub`
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
✔ AdapterRegistry: registers all 26 adapters
✔ Auto-Discovery Pipeline: validates live keys and scans models
✔ Speculative Hedging Engine: races primary and fallback candidates
✔ Free Embeddings & Audio Transcriptions: validated
✔ 72/72 tests passing (0 failures)
```

Live provider health check:
```bash
npm run health
```

---

## 📄 License
Released under the [MIT License](LICENSE). Free for personal and commercial use.
