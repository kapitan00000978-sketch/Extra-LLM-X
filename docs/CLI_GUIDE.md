# ⚡ Extra LLM X — CLI Reference Guide

**Extra LLM X** can be executed globally from anywhere using a single command: `extra-llm` or simply `extra`.

---

## 🚀 Quick Start (Single Command)

### 1. Global Installation / Linking
Run once from inside the project directory:
```bash
npm link
# or
npm install -g .
```

Now `extra-llm` and `extra` are available across your entire system (PowerShell, CMD, Bash, Zsh)!

```bash
# Start the Gateway and Web Hub with 1 command:
extra-llm

# Or use the short alias:
extra
```

---

## 📋 Available Commands & Syntax

| Command | Short Alias | Description |
| :--- | :--- | :--- |
| `extra-llm` | `extra` | Starts the server on default port `3000` (starts interactive or background). |
| `extra-llm start [--port 8080]` | `extra start -p 8080` | Starts the gateway on a custom port. |
| `extra-llm status` | `extra status` | Checks if the Extra LLM X server is running and prints active stats. |
| `extra-llm key new [label]` | `extra key new "my-app"` | **Instantly generates a 100% working random system API key** (`elx-...`). |
| `extra-llm key list` | `extra key list` | Lists all active system API keys, usage counts, and creation dates. |
| `extra-llm combos` | `extra combos` | Displays all 6 Virtual Routing Combos with description and fallback lists. |
| `extra-llm models` | `extra models` | Scans and lists all registered native providers and their popular models. |
| `extra-llm --help` | `extra -h` | Shows full CLI documentation and help menu. |
| `extra-llm --version` | `extra -v` | Prints current Extra LLM X version (e.g. `1.2.0`). |

---

## 🛠️ Usage Examples

### 1. Start Server on Port 3000
```powershell
extra-llm
```
Output:
```
==============================================================
 EXTRA LLM X - 100% FREE MULTI-PROVIDER AI GATEWAY & HUB
==============================================================
🚀 Extra LLM X Gateway starting on port: 3000
🌐 Web UI & Dashboard: http://localhost:3000/
📡 OpenAI Compatible Endpoint: http://localhost:3000/v1/chat/completions
==============================================================
```

### 2. Generate a 100% Working Random API Key
```powershell
extra-llm key new "Cursor-Dev"
```
Output:
```
🔑 Generated new Extra LLM X API Key:
------------------------------------------------------------
Key:   elx-live-a8f3b9c1d4e24679
Label: Cursor-Dev
Role:  admin
------------------------------------------------------------
Use with Bearer header: Authorization: Bearer elx-live-a8f3b9c1d4e24679
```

### 3. Check Server Status
```powershell
extra status
```
Output:
```
🟢 Extra LLM X Gateway is RUNNING on http://localhost:3000
   Version: 1.2.0
   Uptime:  142m
   Native Adapters: 80+
```

### 4. Inspect Virtual Combos
```powershell
extra combos
```
Output:
```
⚡ Extra LLM X Virtual Combos:
------------------------------------------------------------
• extra/auto-free
  Smart multi-provider fallback across all free tiers
• extra/free-coding
  Optimized for code generation, refactoring, and code review
• extra/fast-chat
  Low-latency conversational models with speculative hedging
• extra/deep-reasoning
  High-compute reasoning and chain-of-thought models (R1/QwQ)
• extra/creative
  High-entropy artistic writing and brainstorming models
• extra/frontier
  Frontier models (Claude 3.5, GPT-4o, DeepSeek V3) with zero-cost fallback
```

---

## 🔌 Using with Cursor, Claude Code, Cline & Roo Code

1. In your editor settings, set:
   - **Provider:** OpenAI Compatible
   - **Base URL:** `http://localhost:3000/v1`
   - **API Key:** `elx-live-master-free-hub` (or key from `extra-llm key new`)
   - **Model:** `extra/free-coding` or `extra/auto-free`
2. You now have unlimited zero-cost AI assistance with automated failover across 80+ providers!
