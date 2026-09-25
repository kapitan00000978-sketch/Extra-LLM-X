import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extra LLM X — 100% Free Multi-Provider AI Gateway</title>
  <meta name="description" content="Next-Gen 100% Free AI Model Gateway & Key Orchestrator for 400+ Providers, Cursor, Claude Code, Python SDK, and Developer Tools.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div class="glow-bg-top"></div>
  <div class="glow-bg-bottom"></div>

  <!-- Header -->
  <header class="app-header">
    <div class="header-left">
      <div class="brand-logo">
        <span class="logo-icon">⚡</span>
        <div class="brand-text">
          <span class="brand-title">EXTRA <span class="highlight-cyan">LLM</span> <span class="highlight-neon">X</span></span>
          <span class="brand-badge">100% FREE AI GATEWAY</span>
        </div>
      </div>
      <div class="server-pill" id="header-server-pill">
        <span class="pulse-dot"></span>
        <span id="server-status-text">ONLINE • 400+ PROVIDERS & 5B TOKENS/MO</span>
      </div>
    </div>

    <div class="header-center">
      <nav class="nav-tabs" id="nav-tabs">
        <button class="nav-btn active" data-tab="tab-cockpit" id="btn-nav-cockpit">
          <span class="icon">🚀</span> Cockpit
        </button>
        <button class="nav-btn" data-tab="tab-providers" id="btn-nav-providers">
          <span class="icon">🌐</span> Providers <span class="badge-count" id="badge-providers-count">400+</span>
        </button>
        <button class="nav-btn" data-tab="tab-models" id="btn-nav-models">
          <span class="icon">🧠</span> Models <span class="badge-count" id="badge-models-count">650+</span>
        </button>
        <button class="nav-btn" data-tab="tab-keys" id="btn-nav-keys">
          <span class="icon">🔑</span> API Keys
        </button>
        <button class="nav-btn" data-tab="tab-gateway" id="btn-nav-gateway">
          <span class="icon">⚡</span> Integrations
        </button>
        <button class="nav-btn" data-tab="tab-playground" id="btn-nav-playground">
          <span class="icon">💬</span> Playground
        </button>
        <button class="nav-btn" data-tab="tab-rankings" id="btn-nav-rankings">
          <span class="icon">🏆</span> Rankings
        </button>
        <button class="nav-btn" data-tab="tab-logs" id="btn-nav-logs">
          <span class="icon">📊</span> Telemetry
        </button>
        <button class="nav-btn" data-tab="tab-webhooks" id="btn-nav-webhooks">
          <span class="icon">🔔</span> Alerts
        </button>
      </nav>
    </div>

    <div class="header-right">
      <button class="btn-shortcuts-toggle" id="btn-open-shortcuts" title="Keyboard Shortcuts (Press ?)">⌨️ [?]</button>
      <button class="theme-toggle-btn" id="btn-theme-toggle" title="Switch Theme">🎨 Neon</button>
      <div class="api-base-tag">
        <span class="tag-label">Base URL:</span>
        <code id="header-base-url">http://localhost:3000/v1</code>
        <button class="btn-copy-small" id="btn-copy-base-url" title="Copy Base URL">📋</button>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="main-content" id="main-content">

    <!-- TAB 1: COCKPIT -->
    <section class="tab-pane active" id="tab-cockpit">
      <div class="hero-section">
        <div class="hero-content">
          <div class="hero-badge">⚡ ZERO-COST INTELLIGENCE • SELF-HEALING FAILOVER</div>
          <h1 class="hero-title">100% Free AI Provider Hub for <span class="gradient-text">Developers & AI Agents</span></h1>
          <p class="hero-desc">
            Orchestrating <strong>400+ Global Providers</strong> with over <strong>5 Billion Free Tokens/Month</strong>. Unifies DeepSeek, Groq, Cerebras, Google Gemini, GitHub Models, SambaNova, and community inference clouds into one ultra-fast, OpenAI-compatible gateway.
          </p>
          <div class="hero-actions">
            <button class="btn-primary" id="btn-hero-open-keys">
              <span>🔑 Master Gateway Key</span>
            </button>
            <button class="btn-outline" id="btn-hero-open-gateway">
              <span>⚡ Connect IDEs & Apps</span>
            </button>
            <button class="btn-secondary" id="btn-hero-quick-scan">
              <span>🔍 Auto-Discover Free Models</span>
            </button>
          </div>
        </div>

        <div class="hero-metrics-grid">
          <div class="metric-card metric-cyan">
            <div class="metric-header">
              <span class="metric-title">Free Monthly Capacity</span>
              <span class="metric-icon">💎</span>
            </div>
            <div class="metric-value" id="metric-monthly-capacity">5B+</div>
            <div class="metric-sub">Aggregated Free Monthly Tokens</div>
          </div>
          <div class="metric-card metric-neon">
            <div class="metric-header">
              <span class="metric-title">Active Free Models</span>
              <span class="metric-icon">🧠</span>
            </div>
            <div class="metric-value" id="metric-active-models">650+</div>
            <div class="metric-sub">Auto-Discovered & Ready</div>
          </div>
          <div class="metric-card metric-purple">
            <div class="metric-header">
              <span class="metric-title">Supported Providers</span>
              <span class="metric-icon">🌐</span>
            </div>
            <div class="metric-value" id="metric-configured-providers">400+</div>
            <div class="metric-sub">26 Built-in + 375+ Directory</div>
          </div>
          <div class="metric-card metric-amber">
            <div class="metric-header">
              <span class="metric-title">Est. Monthly Savings</span>
              <span class="metric-icon">💰</span>
            </div>
            <div class="metric-value" id="metric-total-savings">$0.00</div>
            <div class="metric-sub">Compared to Commercial APIs</div>
          </div>
        </div>
      </div>

      <!-- Quick Combos & Routing -->
      <div class="section-container">
        <div class="section-header-wrap">
          <div>
            <h2 class="section-title">⚡ Smart Auto-Fallback Combos</h2>
            <p class="section-subtitle">Use these virtual model names in Cursor, Claude Code, Cline, or Python SDK for continuous 99.9% uptime</p>
          </div>
        </div>

        <div class="combos-grid" id="combos-container">
          <!-- Populated by app.js -->
        </div>
      </div>

      <!-- Live Provider Status Podium -->
      <div class="section-container">
        <div class="section-header-wrap">
          <div>
            <h2 class="section-title">🏆 Real-Time Provider Speed & Latency Podium</h2>
            <p class="section-subtitle">Dynamic benchmarking measuring throughput (tok/s) and Time-To-First-Token (TTFT)</p>
          </div>
          <button class="btn-sm-refresh" id="btn-refresh-benchmarks">🔄 Refresh Benchmarks</button>
        </div>
        <div class="podium-grid" id="podium-container">
          <!-- Populated by app.js -->
        </div>
      </div>
    </section>

    <!-- TAB 2: PROVIDERS HUB (400+) -->
    <section class="tab-pane" id="tab-providers">
      <div class="section-container">
        <div class="section-header-wrap">
          <div>
            <h2 class="section-title">🌐 Global AI Providers Hub (400+ Directory)</h2>
            <p class="section-subtitle">Manage API keys, register custom endpoints, and auto-discover free models with 1-click live testing</p>
          </div>
          <div class="header-buttons-row">
            <button class="btn-primary" id="btn-open-custom-provider-modal">+ Add Custom Provider</button>
            <button class="btn-outline" id="btn-open-key-wizard">⚡ Quick Key Assistant</button>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="providers-filter-bar">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" id="input-search-providers" placeholder="Search 400+ providers (Google, Groq, Cerebras, DeepSeek, Ollama, Together, Mistral...)">
          </div>
          <div class="filter-chips" id="filter-providers-chips">
            <button class="chip active" data-filter="all">All (400+)</button>
            <button class="chip" data-filter="configured">Connected Keys</button>
            <button class="chip" data-filter="zero-key">Zero-Key (No-Auth)</button>
            <button class="chip" data-filter="lpu">Ultra-Fast LPU</button>
            <button class="chip" data-filter="hyperscaler">Hyperscalers</button>
            <button class="chip" data-filter="local">Local / Offline</button>
          </div>
        </div>

        <!-- Providers Grid -->
        <div class="providers-grid" id="providers-portals-grid">
          <!-- Populated by app.js -->
        </div>
      </div>
    </section>

    <!-- TAB 3: FREE MODELS CATALOG -->
    <section class="tab-pane" id="tab-models">
      <div class="section-container">
        <div class="section-header-wrap">
          <div>
            <h2 class="section-title">🧠 Free Models Catalog (650+ Active)</h2>
            <p class="section-subtitle">Explore, search, and test all verified $0 cost models across all registered providers</p>
          </div>
          <button class="btn-primary" id="btn-trigger-full-scan">🔍 Rescan All Providers</button>
        </div>

        <div class="models-toolbar">
          <div class="search-input-wrap flex-1">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" id="input-search-models" placeholder="Filter models by name, provider, architecture (e.g. llama-3.3, deepseek, gemini, qwen)...">
          </div>
          <select class="select-dropdown" id="select-model-provider-filter">
            <option value="all">All Providers</option>
          </select>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="table-models">
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Provider</th>
                <th>Model ID</th>
                <th>Context</th>
                <th>Capabilities</th>
                <th>Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="models-table-body">
              <!-- Populated by app.js -->
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- TAB 4: API KEYS MANAGEMENT -->
    <section class="tab-pane" id="tab-keys">
      <div class="section-container">
        <div class="section-header-wrap">
          <div>
            <h2 class="section-title">🔑 Client & Master API Key Management</h2>
            <p class="section-subtitle">Generate and manage OpenAI-compatible Bearer tokens for Cursor, Claude Code, Python SDK, and Cline</p>
          </div>
          <button class="btn-primary" id="btn-open-create-key-modal">+ Create Client API Key</button>
        </div>

        <div class="keys-layout-grid">
          <!-- Master System Key Banner -->
          <div class="card-glass master-key-card">
            <div class="card-tag">DEFAULT MASTER ACCESS KEY</div>
            <h3>Master Gateway Token</h3>
            <p>Use this pre-configured token for zero-setup integration with any OpenAI SDK or IDE:</p>
            <div class="code-snippet-box">
              <pre><code id="display-master-key">elx-live-master-free-hub</code></pre>
              <button class="btn-copy-code" id="btn-copy-master-key">Copy Token</button>
            </div>
            <div class="key-stats-row">
              <span class="badge-cyan">Status: Active</span>
              <span class="badge-purple">Rate Limit: Unlimited</span>
              <span class="badge-neon">Scope: Full Gateway Access</span>
            </div>
          </div>

          <!-- Active Client Keys Table -->
          <div class="card-glass flex-1">
            <h3>Active Client Keys</h3>
            <div class="table-responsive mt-2">
              <table class="data-table" id="table-client-keys">
                <thead>
                  <tr>
                    <th>Key Name</th>
                    <th>Token (Masked)</th>
                    <th>Rate Limit (RPM)</th>
                    <th>Total Requests</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="client-keys-table-body">
                  <!-- Populated by app.js -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 5: INTEGRATIONS & SDKS -->
    <section class="tab-pane" id="tab-gateway">
      <div class="section-container">
        <div class="section-header-wrap">
          <div>
            <h2 class="section-title">⚡ Integrations & Developer SDKs</h2>
            <p class="section-subtitle">Step-by-step connection guides for Python OpenAI SDK, Cursor, Claude Code, Cline, and REST clients</p>
          </div>
        </div>

        <div class="guides-grid">
          <!-- Python SDK -->
          <div class="guide-card card-glass">
            <div class="guide-tag">PYTHON SDK</div>
            <h3>OpenAI Python Client</h3>
            <p>Connect with 3 lines of code using the official <code>openai</code> package:</p>
            <div class="code-snippet-box">
              <pre><code id="code-python-sdk">from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="elx-live-master-free-hub"
)

# 100% Free Streaming Chat
response = client.chat.completions.create(
    model="extra/auto-free",
    messages=[{"role": "user", "content": "Hello Extra LLM X!"}],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="", flush=True)</code></pre>
              <button class="btn-copy-code" id="btn-copy-py-sdk">Copy Code</button>
            </div>
          </div>

          <!-- Cursor IDE / Claude Code / Cline -->
          <div class="guide-card card-glass">
            <div class="guide-tag">IDEs & EXTENSIONS</div>
            <h3>Cursor, Claude Code & Cline</h3>
            <p>Configure custom OpenAI endpoint in settings:</p>
            <div class="code-snippet-box">
              <pre><code id="code-ide-settings">OpenAI Base URL : http://localhost:3000/v1
OpenAI API Key  : elx-live-master-free-hub
Primary Model   : extra/free-coding
Fallback Model  : extra/auto-free</code></pre>
              <button class="btn-copy-code" id="btn-copy-ide-settings">Copy Settings</button>
            </div>
          </div>

          <!-- cURL / REST API -->
          <div class="guide-card card-glass">
            <div class="guide-tag">REST / cURL</div>
            <h3>Direct HTTP Request</h3>
            <p>Execute standard OpenAI-compatible completions:</p>
            <div class="code-snippet-box">
              <pre><code id="code-curl">curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer elx-live-master-free-hub" \
  -d '{
    "model": "extra/auto-free",
    "messages": [{"role": "user", "content": "Explain quantum computing in 2 lines."}]
  }'</code></pre>
              <button class="btn-copy-code" id="btn-copy-curl">Copy cURL</button>
            </div>
          </div>

          <!-- Free Multimodal Endpoints -->
          <div class="guide-card card-glass">
            <div class="guide-tag">MULTIMODAL</div>
            <h3>Embeddings, Audio & Images</h3>
            <p>Access 100% free vector embeddings, Whisper STT, and Flux image generation:</p>
            <div class="code-snippet-box">
              <pre><code># Free Embeddings (1536-dim)
POST /v1/embeddings (model: extra/free-embedding)

# Free Image Generation (Flux / SDXL)
POST /v1/images/generations

# Free Audio Transcription (Whisper Large)
POST /v1/audio/transcriptions</code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 6: PLAYGROUND -->
    <section class="tab-pane" id="tab-playground">
      <div class="section-container playground-container">
        <div class="playground-layout">
          <!-- Chat Sidebar Settings -->
          <div class="playground-sidebar card-glass">
            <h3>Playground Controls</h3>
            <div class="form-group">
              <label for="select-playground-model">Target Model / Virtual Combo:</label>
              <select class="select-dropdown" id="select-playground-model">
                <option value="extra/auto-free">extra/auto-free (Smart Autopilot)</option>
                <option value="extra/free-coding">extra/free-coding (Code Specialist)</option>
                <option value="extra/free-fast">extra/free-fast (Sub-Second LPU)</option>
                <option value="extra/free-reasoning">extra/free-reasoning (DeepSeek-R1)</option>
                <option value="extra/free-vision">extra/free-vision (Multimodal)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="input-playground-temp">Temperature: <span id="val-playground-temp">0.7</span></label>
              <input type="range" class="range-slider" id="input-playground-temp" min="0" max="1" step="0.05" value="0.7">
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="check-playground-stream" checked>
                <span>Live Streaming (SSE)</span>
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="check-playground-search">
                <span>Live Web Search Grounding</span>
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="check-playground-hedging" checked>
                <span>Speculative Hedging (>3.8s Race)</span>
              </label>
            </div>

            <button class="btn-outline w-100 mt-3" id="btn-clear-playground">Clear Conversation</button>
          </div>

          <!-- Chat Messages Window -->
          <div class="playground-chat-window card-glass">
            <div class="chat-messages" id="playground-messages">
              <div class="chat-bubble assistant">
                <div class="bubble-header">⚡ Extra LLM X Assistant</div>
                <div class="bubble-content">
                  Welcome! The gateway is ready to route your queries across 400+ providers and 650+ free models. Type any question, code request, or reasoning problem below!
                </div>
              </div>
            </div>

            <!-- Chat Input Form -->
            <div class="chat-input-area">
              <textarea class="chat-textarea" id="input-playground-message" rows="2" placeholder="Ask anything or prompt code (Shift+Enter for new line, Enter to send)..."></textarea>
              <button class="btn-primary btn-send" id="btn-send-playground">Send ⚡</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 7: RANKINGS & BENCHMARKS -->
    <section class="tab-pane" id="tab-rankings">
      <div class="section-container">
        <div class="section-header-wrap">
          <div>
            <h2 class="section-title">🏆 Live Provider Speed & Reliability Rankings</h2>
            <p class="section-subtitle">Dynamic benchmarking measuring throughput (tok/s), Time-To-First-Token (TTFT), and availability</p>
          </div>
          <button class="btn-primary" id="btn-run-all-benchmarks">⚡ Run Live Benchmark Race</button>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="table-rankings">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Provider</th>
                <th>Speed (tok/s)</th>
                <th>TTFT (Latency)</th>
                <th>Availability</th>
                <th>Free Tier Tiering</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="rankings-table-body">
              <!-- Populated by app.js -->
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- TAB 8: TELEMETRY & LOGS -->
    <section class="tab-pane" id="tab-logs">
      <div class="section-container">
        <div class="section-header-wrap">
          <div>
            <h2 class="section-title">📊 Real-Time Telemetry & Request Logs</h2>
            <p class="section-subtitle">Live stream of intercepted requests, failover transitions, token savings, and execution latency</p>
          </div>
          <button class="btn-outline" id="btn-refresh-logs">🔄 Refresh Logs</button>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="table-logs">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Requested Model</th>
                <th>Routed Provider</th>
                <th>Tokens (In/Out)</th>
                <th>Latency</th>
                <th>Status</th>
                <th>Est. Savings</th>
              </tr>
            </thead>
            <tbody id="logs-table-body">
              <!-- Populated by app.js -->
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- TAB 9: ALERTS & WEBHOOKS -->
    <section class="tab-pane" id="tab-webhooks">
      <div class="section-container">
        <div class="section-header-wrap">
          <div>
            <h2 class="section-title">🔔 Real-Time Webhooks & Alert Subscriptions</h2>
            <p class="section-subtitle">Stream instant alerts to Discord, Slack, or webhook endpoints on rate limits, failovers, and milestones</p>
          </div>
          <button class="btn-primary" id="btn-open-create-webhook-modal">+ Register Webhook Endpoint</button>
        </div>

        <div class="webhooks-grid" id="webhooks-container">
          <!-- Populated by app.js -->
        </div>
      </div>
    </section>
  </main>

  <!-- MODAL: ADD / CONFIGURE PROVIDER KEY -->
  <div class="modal-overlay" id="modal-provider-key">
    <div class="modal-card card-glass">
      <div class="modal-header">
        <h3 id="modal-provider-title">Configure Provider Key</h3>
        <button class="btn-close-modal" id="btn-close-key-modal">&times;</button>
      </div>
      <div class="modal-body">
        <p class="modal-desc" id="modal-provider-guide">Paste your API key below. Extra LLM X will automatically test it and discover all available free models.</p>
        
        <div class="form-group">
          <label for="input-provider-key">API Key:</label>
          <input type="password" class="input-text" id="input-provider-key" placeholder="e.g. gsk_... or AIza...">
        </div>

        <div class="form-group">
          <label for="input-provider-label">Optional Label / Note:</label>
          <input type="text" class="input-text" id="input-provider-label" placeholder="e.g. Main Developer Key">
        </div>

        <div class="portal-link-box" id="box-portal-link">
          <span>Don't have a free key?</span>
          <a href="#" target="_blank" id="link-get-free-key" class="link-neon">Get Free API Key ↗</a>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="btn-cancel-key-modal">Cancel</button>
        <button class="btn-primary" id="btn-save-provider-key">⚡ Verify & Auto-Discover Models</button>
      </div>
    </div>
  </div>

  <!-- MODAL: ADD CUSTOM PROVIDER -->
  <div class="modal-overlay" id="modal-custom-provider">
    <div class="modal-card card-glass">
      <div class="modal-header">
        <h3>Add Custom OpenAI-Compatible Provider</h3>
        <button class="btn-close-modal" id="btn-close-custom-modal">&times;</button>
      </div>
      <div class="modal-body">
        <p class="modal-desc">Add any OpenAI-compatible API endpoint (e.g. vLLM, Ollama, LocalAI, Anyscale, Together, custom proxy).</p>
        
        <div class="form-group">
          <label for="input-custom-name">Provider Name:</label>
          <input type="text" class="input-text" id="input-custom-name" placeholder="e.g. My Private vLLM Cluster">
        </div>

        <div class="form-group">
          <label for="input-custom-base-url">Base URL:</label>
          <input type="text" class="input-text" id="input-custom-base-url" placeholder="e.g. http://localhost:8000/v1 or https://api.together.xyz/v1">
        </div>

        <div class="form-group">
          <label for="input-custom-key">API Key / Bearer Token:</label>
          <input type="password" class="input-text" id="input-custom-key" placeholder="API key or dummy token (sk-...)">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="btn-cancel-custom-modal">Cancel</button>
        <button class="btn-primary" id="btn-save-custom-provider">⚡ Probe & Auto-Discover Models</button>
      </div>
    </div>
  </div>

  <!-- MODAL: CREATE CLIENT API KEY -->
  <div class="modal-overlay" id="modal-create-client-key">
    <div class="modal-card card-glass">
      <div class="modal-header">
        <h3>Create New Client API Key</h3>
        <button class="btn-close-modal" id="btn-close-create-client-key">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="input-client-key-name">Client / Application Name:</label>
          <input type="text" class="input-text" id="input-client-key-name" placeholder="e.g. Cursor Workstation #2">
        </div>
        <div class="form-group">
          <label for="input-client-key-rpm">Rate Limit (RPM):</label>
          <input type="number" class="input-text" id="input-client-key-rpm" value="120" min="10" max="1000">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="btn-cancel-create-client-key">Cancel</button>
        <button class="btn-primary" id="btn-confirm-create-client-key">Generate Token 🔑</button>
      </div>
    </div>
  </div>

  <!-- Toast Container -->
  <div class="toast-container" id="toast-container"></div>

  <script src="/js/app.js"></script>
</body>
</html>`;

fs.writeFileSync(path.join(rootDir, 'public', 'index.html'), indexHtml, 'utf8');
console.log('index.html written successfully in UTF-8');
