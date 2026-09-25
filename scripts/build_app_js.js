import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const appJs = `/**
 * Extra LLM X — Frontend Controller
 * 100% Free AI Gateway & Model Provider Orchestrator
 */

// Global State
const state = {
  activeTab: 'tab-cockpit',
  providers: [],
  directory: [],
  models: [],
  combos: [],
  systemKeys: [],
  benchmarks: [],
  logs: [],
  webhooks: [],
  selectedProviderForModal: null,
  activeFilter: 'all'
};

// DOM Initializer
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initModals();
  initPlayground();
  initFilters();
  initThemeToggle();
  initShortcuts();
  
  // Initial Data Fetch
  loadAllData();
  
  // Auto-refresh stats and logs every 15s
  setInterval(loadTelemetryAndStats, 15000);
});

/* ==========================================================================
   Navigation & Tabs
   ========================================================================== */
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      switchTab(target);
    });
  });

  // Hero action buttons
  document.getElementById('btn-hero-open-keys')?.addEventListener('click', () => switchTab('tab-keys'));
  document.getElementById('btn-hero-open-gateway')?.addEventListener('click', () => switchTab('tab-gateway'));
  document.getElementById('btn-hero-quick-scan')?.addEventListener('click', () => {
    switchTab('tab-models');
    triggerFullScan();
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === tabId);
  });
}

/* ==========================================================================
   Data Loaders
   ========================================================================== */
async function loadAllData() {
  await Promise.all([
    loadStats(),
    loadCombos(),
    loadProviders(),
    loadModels(),
    loadSystemKeys(),
    loadBenchmarks(),
    loadLogs(),
    loadWebhooks()
  ]);
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return;
    const data = await res.json();
    
    if (document.getElementById('metric-total-savings')) {
      document.getElementById('metric-total-savings').textContent = \`$\${(data.estimatedSavingsUsd || 0).toFixed(2)}\`;
    }
    if (document.getElementById('metric-active-models')) {
      document.getElementById('metric-active-models').textContent = \`\${data.activeFreeModels || 650}+\`;
    }
  } catch (err) {
    console.warn('[Stats] Load error:', err);
  }
}

async function loadCombos() {
  try {
    const res = await fetch('/api/combos');
    if (!res.ok) return;
    state.combos = await res.json();
    renderCombos();
  } catch (err) {
    console.warn('[Combos] Load error:', err);
  }
}

function renderCombos() {
  const container = document.getElementById('combos-container');
  if (!container) return;

  const defaultCombos = [
    { name: 'extra/auto-free', title: 'Auto-Pilot Smart Combo', desc: 'Auto-selects highest quality available free model (DeepSeek → Groq → SambaNova → Cerebras)', badge: 'Recommended' },
    { name: 'extra/free-coding', title: 'Code Generation Specialist', desc: 'Specialized pipeline for code synthesis, debugging, and review (Codestral → Qwen 2.5 Coder → Llama 3.3)', badge: 'Coding' },
    { name: 'extra/free-fast', title: 'Sub-Second LPU Speed', desc: 'Ultra-low latency models running at 500-2000 tok/s on dedicated LPUs (Cerebras → Groq)', badge: '500+ tok/s' },
    { name: 'extra/free-reasoning', title: 'Deep Reasoning & Logic', desc: 'Mathematical reasoning, algorithmic deduction, and step-by-step thinking (DeepSeek-R1 → SambaNova R1)', badge: 'Reasoning' },
    { name: 'extra/free-vision', title: 'Multimodal Vision', desc: 'Image analysis, diagram inspection, and visual reasoning (Gemini 2.0 Flash → GPT-4o Mini)', badge: 'Vision' }
  ];

  container.innerHTML = defaultCombos.map(c => \`
    <div class=\"combo-card card-glass\">
      <div class=\"combo-header\">
        <span class=\"combo-name\">\${c.name}</span>
        <span class=\"badge-neon\">\${c.badge}</span>
      </div>
      <h4>\${c.title}</h4>
      <p>\${c.desc}</p>
      <div class=\"combo-actions\">
        <button class=\"btn-copy-sm\" onclick=\"copyToClipboard('\${c.name}', 'Combo model name copied!')\">📋 Copy Name</button>
        <button class=\"btn-test-sm\" onclick=\"testComboInPlayground('\${c.name}')\">⚡ Test Live</button>
      </div>
    </div>
  \`).join('');
}

async function loadProviders() {
  try {
    const [portalsRes, dirRes] = await Promise.all([
      fetch('/api/providers/portals'),
      fetch('/api/providers/directory')
    ]);

    if (portalsRes.ok) state.providers = await portalsRes.json();
    if (dirRes.ok) {
      const dirData = await dirRes.json();
      state.directory = dirData.providers || [];
    }
    
    renderProviders();
    updateProviderCounts();
  } catch (err) {
    console.warn('[Providers] Load error:', err);
  }
}

function updateProviderCounts() {
  const badge = document.getElementById('badge-providers-count');
  if (badge) badge.textContent = \`\${state.directory.length || 400}+\`;
  const heroBadge = document.getElementById('metric-configured-providers');
  if (heroBadge) heroBadge.textContent = \`\${state.directory.length || 400}+\`;
}

function renderProviders() {
  const grid = document.getElementById('providers-portals-grid');
  if (!grid) return;

  const filterText = (document.getElementById('input-search-providers')?.value || '').toLowerCase();
  
  // Merge core portals with full 400+ directory
  const portalMap = new Map(state.providers.map(p => [p.id, p]));
  let combined = state.directory.map(d => {
    const portal = portalMap.get(d.id);
    return portal ? { ...portal, category: d.category } : d;
  });

  if (state.activeFilter === 'configured') {
    combined = combined.filter(p => p.hasKey || (p.keys && p.keys.length > 0));
  } else if (state.activeFilter === 'zero-key') {
    combined = combined.filter(p => p.isNoAuth || p.id === 'puter' || p.id === 'pollinations' || p.id === 'opencode' || p.id === 'kilo');
  } else if (state.activeFilter === 'lpu') {
    combined = combined.filter(p => p.id === 'groq' || p.id === 'cerebras' || p.id === 'sambanova');
  } else if (state.activeFilter === 'local') {
    combined = combined.filter(p => p.id === 'ollama' || p.id === 'lmstudio');
  }

  if (filterText) {
    combined = combined.filter(p => 
      p.name.toLowerCase().includes(filterText) ||
      p.id.toLowerCase().includes(filterText) ||
      (p.freeTierInfo && p.freeTierInfo.toLowerCase().includes(filterText)) ||
      (p.category && p.category.toLowerCase().includes(filterText))
    );
  }

  if (combined.length === 0) {
    grid.innerHTML = \`<div class=\"empty-state\">No providers found matching \"\${filterText}\".</div>\`;
    return;
  }

  grid.innerHTML = combined.map(p => {
    const isConfigured = p.hasKey || (p.keys && p.keys.some(k => k.active === 1));
    const isNoAuth = p.isNoAuth || p.id === 'puter' || p.id === 'pollinations' || p.id === 'opencode' || p.id === 'kilo' || p.id === 'ollama' || p.id === 'lmstudio';

    let statusBadge = isConfigured 
      ? \`<span class=\"status-pill status-online\">● Connected (\${p.keyCount || p.keys?.length || 1} key)</span>\`
      : isNoAuth
      ? \`<span class=\"status-pill status-zero\">● Zero-Key (Public)</span>\`
      : \`<span class=\"status-pill status-offline\">○ Key Needed</span>\`;

    return \`
      <div class=\"provider-card card-glass\">
        <div class=\"provider-header\">
          <div class=\"provider-title-wrap\">
            <h4 class=\"provider-title\">\${p.name}</h4>
            <span class=\"badge-cyan\">\${p.category || p.badge || 'Cloud AI'}</span>
          </div>
          \${statusBadge}
        </div>
        <p class=\"provider-desc\">\${p.freeTierInfo || p.freeTier || 'Free Developer Access'}</p>
        <div class=\"provider-models-preview\">
          \${(p.popularModels || []).slice(0, 3).map(m => \`<span class=\"model-tag\">\${m}</span>\`).join('')}
        </div>
        <div class=\"provider-actions\">
          \${p.getKeyUrl ? \`<a href=\"\${p.getKeyUrl}\" target=\"_blank\" class=\"btn-portal\">🔗 Get Free Key</a>\` : ''}
          <button class=\"btn-add-key\" onclick=\"openKeyModal('\${p.id}', '\${p.name}', '\${p.getKeyUrl || ''}', '\${p.guide || ''}')\">
            \${isConfigured ? '⚡ Manage / Add Key' : '+ Add API Key'}
          </button>
        </div>
      </div>
    \`;
  }).join('');
}

function initFilters() {
  document.querySelectorAll('#filter-providers-chips .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filter-providers-chips .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.getAttribute('data-filter');
      renderProviders();
    });
  });

  document.getElementById('input-search-providers')?.addEventListener('input', () => {
    renderProviders();
  });

  document.getElementById('input-search-models')?.addEventListener('input', () => {
    renderModels();
  });

  document.getElementById('select-model-provider-filter')?.addEventListener('change', () => {
    renderModels();
  });
}

/* ==========================================================================
   Models Catalog
   ========================================================================== */
async function loadModels() {
  try {
    const res = await fetch('/api/models');
    if (!res.ok) return;
    state.models = await res.json();
    
    // Update count
    const countBadge = document.getElementById('badge-models-count');
    if (countBadge) countBadge.textContent = \`\${state.models.length}+\`;
    
    // Populate provider dropdown
    const select = document.getElementById('select-model-provider-filter');
    if (select) {
      const providers = Array.from(new Set(state.models.map(m => m.provider))).sort();
      select.innerHTML = '<option value=\"all\">All Providers</option>' + 
        providers.map(p => \`<option value=\"\${p}\">\${p.toUpperCase()}</option>\`).join('');
    }

    renderModels();
  } catch (err) {
    console.warn('[Models] Load error:', err);
  }
}

function renderModels() {
  const tbody = document.getElementById('models-table-body');
  if (!tbody) return;

  const search = (document.getElementById('input-search-models')?.value || '').toLowerCase();
  const selectedProvider = document.getElementById('select-model-provider-filter')?.value || 'all';

  let filtered = state.models;
  if (selectedProvider !== 'all') {
    filtered = filtered.filter(m => m.provider === selectedProvider);
  }
  if (search) {
    filtered = filtered.filter(m => 
      m.model_id.toLowerCase().includes(search) ||
      m.display_name.toLowerCase().includes(search) ||
      m.provider.toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan=\"7\" class=\"text-center py-4\">No models found matching your search.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.slice(0, 100).map(m => \`
    <tr>
      <td><strong>\${m.display_name || m.model_id}</strong></td>
      <td><span class=\"badge-cyan\">\${m.provider}</span></td>
      <td><code>\${m.model_id}</code></td>
      <td>\${m.context_window ? m.context_window.toLocaleString() + ' tok' : '8,192 tok'}</td>
      <td><span class=\"badge-purple\">\${m.capabilities || 'chat'}</span></td>
      <td><span class=\"badge-neon\">$0.00 Free</span></td>
      <td>
        <button class=\"btn-copy-sm\" onclick=\"testModelInPlayground('\${m.provider}/\${m.model_id}')\">⚡ Test</button>
      </td>
    </tr>
  \`).join('');
}

async function triggerFullScan() {
  showToast('Initiating Auto-Discovery across all providers...', 'info');
  try {
    const res = await fetch('/api/providers/scan', { method: 'POST' });
    const data = await res.json();
    showToast(\`Scan complete! Discovered \${data.totalDiscovered || 0} models.\`, 'success');
    await loadModels();
  } catch (err) {
    showToast('Scan failed: ' + err.message, 'error');
  }
}

/* ==========================================================================
   API Keys Management
   ========================================================================== */
async function loadSystemKeys() {
  try {
    const res = await fetch('/api/system-keys');
    if (!res.ok) return;
    state.systemKeys = await res.json();
    renderSystemKeys();
  } catch (err) {
    console.warn('[Keys] Load error:', err);
  }
}

function renderSystemKeys() {
  const tbody = document.getElementById('client-keys-table-body');
  if (!tbody) return;

  if (state.systemKeys.length === 0) {
    tbody.innerHTML = '<tr><td colspan=\"5\" class=\"text-center py-4\">No client keys created yet.</td></tr>';
    return;
  }

  tbody.innerHTML = state.systemKeys.map(k => \`
    <tr>
      <td><strong>\${k.name}</strong></td>
      <td><code>\${k.key.slice(0, 8)}...</code></td>
      <td>\${k.rate_limit_rpm} RPM</td>
      <td>\${k.request_count || 0} reqs</td>
      <td>
        <button class=\"btn-copy-sm\" onclick=\"copyToClipboard('\${k.key}', 'API Key copied!')\">📋 Copy</button>
        <button class=\"btn-delete-sm\" onclick=\"deleteSystemKey('\${k.key}')\">🗑 Revoke</button>
      </td>
    </tr>
  \`).join('');
}

async function deleteSystemKey(key) {
  if (!confirm('Are you sure you want to revoke this API key?')) return;
  try {
    const res = await fetch(\`/api/system-keys/\${encodeURIComponent(key)}\`, { method: 'DELETE' });
    if (res.ok) {
      showToast('API Key revoked successfully', 'success');
      loadSystemKeys();
    }
  } catch (err) {
    showToast('Failed to revoke key: ' + err.message, 'error');
  }
}

/* ==========================================================================
   Modals Management
   ========================================================================== */
function initModals() {
  // Provider Key Modal
  const modalKey = document.getElementById('modal-provider-key');
  document.getElementById('btn-close-key-modal')?.addEventListener('click', () => modalKey.classList.remove('active'));
  document.getElementById('btn-cancel-key-modal')?.addEventListener('click', () => modalKey.classList.remove('active'));
  document.getElementById('btn-save-provider-key')?.addEventListener('click', saveProviderKey);

  // Custom Provider Modal
  const modalCustom = document.getElementById('modal-custom-provider');
  document.getElementById('btn-open-custom-provider-modal')?.addEventListener('click', () => modalCustom.classList.add('active'));
  document.getElementById('btn-close-custom-modal')?.addEventListener('click', () => modalCustom.classList.remove('active'));
  document.getElementById('btn-cancel-custom-modal')?.addEventListener('click', () => modalCustom.classList.remove('active'));
  document.getElementById('btn-save-custom-provider')?.addEventListener('click', saveCustomProvider);

  // Create Client Key Modal
  const modalClient = document.getElementById('modal-create-client-key');
  document.getElementById('btn-open-create-key-modal')?.addEventListener('click', () => modalClient.classList.add('active'));
  document.getElementById('btn-close-create-client-key')?.addEventListener('click', () => modalClient.classList.remove('active'));
  document.getElementById('btn-cancel-create-client-key')?.addEventListener('click', () => modalClient.classList.remove('active'));
  document.getElementById('btn-confirm-create-client-key')?.addEventListener('click', createClientKey);

  // Copy Buttons
  document.getElementById('btn-copy-base-url')?.addEventListener('click', () => copyToClipboard('http://localhost:3000/v1', 'Base URL copied!'));
  document.getElementById('btn-copy-master-key')?.addEventListener('click', () => copyToClipboard('elx-live-master-free-hub', 'Master Key copied!'));
  document.getElementById('btn-copy-py-sdk')?.addEventListener('click', () => copySnippet('code-python-sdk'));
  document.getElementById('btn-copy-ide-settings')?.addEventListener('click', () => copySnippet('code-ide-settings'));
  document.getElementById('btn-copy-curl')?.addEventListener('click', () => copySnippet('code-curl'));
  document.getElementById('btn-trigger-full-scan')?.addEventListener('click', triggerFullScan);
  document.getElementById('btn-refresh-benchmarks')?.addEventListener('click', loadBenchmarks);
  document.getElementById('btn-refresh-logs')?.addEventListener('click', loadLogs);
  document.getElementById('btn-run-all-benchmarks')?.addEventListener('click', runBenchmarks);
}

window.openKeyModal = function(id, name, getUrl, guide) {
  state.selectedProviderForModal = id;
  document.getElementById('modal-provider-title').textContent = \`Configure \${name} Key\`;
  document.getElementById('modal-provider-guide').textContent = guide || \`Paste your \${name} API key. Extra LLM X will validate it live and auto-discover models.\`;
  
  const link = document.getElementById('link-get-free-key');
  if (link && getUrl) {
    link.href = getUrl;
    link.parentElement.style.display = 'block';
  } else if (link) {
    link.parentElement.style.display = 'none';
  }

  document.getElementById('input-provider-key').value = '';
  document.getElementById('input-provider-label').value = '';
  document.getElementById('modal-provider-key').classList.add('active');
};

async function saveProviderKey() {
  const provider = state.selectedProviderForModal;
  const apiKey = document.getElementById('input-provider-key').value.trim();
  const label = document.getElementById('input-provider-label').value.trim();

  if (!apiKey) {
    showToast('Please enter a valid API key.', 'error');
    return;
  }

  showToast('Validating key and auto-discovering free models...', 'info');
  try {
    const res = await fetch('/api/providers/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, label })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save key');

    document.getElementById('modal-provider-key').classList.remove('active');
    showToast(\`Key saved! Discovered \${data.modelsDiscovered || 0} models.\`, 'success');
    
    await loadProviders();
    await loadModels();
  } catch (err) {
    showToast('Key validation error: ' + err.message, 'error');
  }
}

async function saveCustomProvider() {
  const name = document.getElementById('input-custom-name').value.trim();
  const baseUrl = document.getElementById('input-custom-base-url').value.trim();
  const apiKey = document.getElementById('input-custom-key').value.trim();

  if (!name || !apiKey) {
    showToast('Provider Name and API Key are required.', 'error');
    return;
  }

  showToast('Connecting custom endpoint...', 'info');
  try {
    const res = await fetch('/api/providers/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, baseUrl, apiKey })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add custom provider');

    document.getElementById('modal-custom-provider').classList.remove('active');
    showToast(\`Custom provider '\${name}' added with \${data.modelsDiscovered || 0} models discovered!\`, 'success');
    
    await loadProviders();
    await loadModels();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function createClientKey() {
  const name = document.getElementById('input-client-key-name').value.trim() || 'Custom Client Key';
  const rateLimit = parseInt(document.getElementById('input-client-key-rpm').value || '120', 10);

  try {
    const res = await fetch('/api/system-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, rateLimit })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate key');

    document.getElementById('modal-create-client-key').classList.remove('active');
    showToast('Client key generated successfully!', 'success');
    loadSystemKeys();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

/* ==========================================================================
   Playground
   ========================================================================== */
function initPlayground() {
  const sendBtn = document.getElementById('btn-send-playground');
  const input = document.getElementById('input-playground-message');
  const tempSlider = document.getElementById('input-playground-temp');
  const tempVal = document.getElementById('val-playground-temp');

  tempSlider?.addEventListener('input', (e) => {
    if (tempVal) tempVal.textContent = e.target.value;
  });

  sendBtn?.addEventListener('click', sendPlaygroundMessage);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPlaygroundMessage();
    }
  });

  document.getElementById('btn-clear-playground')?.addEventListener('click', () => {
    const container = document.getElementById('playground-messages');
    if (container) {
      container.innerHTML = \`
        <div class=\"chat-bubble assistant\">
          <div class=\"bubble-header\">⚡ Extra LLM X Assistant</div>
          <div class=\"bubble-content\">Playground conversation cleared. Ready for your prompt!</div>
        </div>
      \`;
    }
  });
}

window.testComboInPlayground = function(comboName) {
  switchTab('tab-playground');
  const select = document.getElementById('select-playground-model');
  if (select) select.value = comboName;
};

window.testModelInPlayground = function(modelId) {
  switchTab('tab-playground');
  const select = document.getElementById('select-playground-model');
  if (select) {
    // Check if exists, else add option
    let opt = select.querySelector(\`option[value=\"\${modelId}\"]\`);
    if (!opt) {
      opt = document.createElement('option');
      opt.value = modelId;
      opt.textContent = modelId;
      select.appendChild(opt);
    }
    select.value = modelId;
  }
};

async function sendPlaygroundMessage() {
  const input = document.getElementById('input-playground-message');
  const text = input.value.trim();
  if (!text) return;

  const model = document.getElementById('select-playground-model').value;
  const stream = document.getElementById('check-playground-stream').checked;
  const container = document.getElementById('playground-messages');

  // Append user message
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.innerHTML = \`<div class=\"bubble-header\">👤 You</div><div class=\"bubble-content\">\${escapeHtml(text)}</div>\`;
  container.appendChild(userBubble);
  input.value = '';
  container.scrollTop = container.scrollHeight;

  // Append assistant message placeholder
  const assistantBubble = document.createElement('div');
  assistantBubble.className = 'chat-bubble assistant';
  assistantBubble.innerHTML = \`<div class=\"bubble-header\">⚡ \${model}</div><div class=\"bubble-content\"><span class=\"typing-dots\">Thinking...</span></div>\`;
  container.appendChild(assistantBubble);
  container.scrollTop = container.scrollHeight;

  const contentDiv = assistantBubble.querySelector('.bubble-content');

  try {
    const res = await fetch('/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer elx-live-master-free-hub'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: text }],
        stream
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error?.message || 'Inference error');
    }

    if (stream) {
      contentDiv.textContent = '';
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const json = JSON.parse(dataStr);
              const delta = json.choices?.[0]?.delta?.content || '';
              contentDiv.textContent += delta;
              container.scrollTop = container.scrollHeight;
            } catch (e) {}
          }
        }
      }
    } else {
      const data = await res.json();
      contentDiv.textContent = data.choices?.[0]?.message?.content || 'No response content.';
    }
  } catch (err) {
    contentDiv.innerHTML = \`<span class=\"text-danger\">Error: \${escapeHtml(err.message)}</span>\`;
  }
}

/* ==========================================================================
   Benchmarks, Telemetry & Webhooks
   ========================================================================== */
async function loadBenchmarks() {
  try {
    const res = await fetch('/api/free-provider-rankings');
    if (!res.ok) return;
    const rankings = await res.json();
    renderBenchmarks(rankings);
  } catch (err) {
    console.warn('[Benchmarks] Load error:', err);
  }
}

function renderBenchmarks(rankings) {
  const podiumContainer = document.getElementById('podium-container');
  const tableBody = document.getElementById('rankings-table-body');

  if (podiumContainer && rankings.length > 0) {
    podiumContainer.innerHTML = rankings.slice(0, 4).map((p, idx) => \`
      <div class=\"podium-card card-glass\">
        <div class=\"podium-rank\">#\${idx + 1}</div>
        <h4>\${p.provider.toUpperCase()}</h4>
        <div class=\"podium-speed\">\${Math.round(p.speed_tok_per_sec || 500)} tok/s</div>
        <div class=\"podium-latency\">TTFT: \${Math.round(p.ttft_ms || 120)}ms</div>
        <span class=\"badge-neon\">100% Free Tier</span>
      </div>
    \`).join('');
  }

  if (tableBody) {
    tableBody.innerHTML = rankings.map((p, idx) => \`
      <tr>
        <td><strong>#\${idx + 1}</strong></td>
        <td><strong>\${p.provider.toUpperCase()}</strong></td>
        <td>\${Math.round(p.speed_tok_per_sec || 450)} tok/s</td>
        <td>\${Math.round(p.ttft_ms || 150)}ms</td>
        <td><span class=\"badge-cyan\">99.9%</span></td>
        <td><span class=\"badge-neon\">$0 / Free Forever</span></td>
        <td><span class=\"badge-purple\">Active</span></td>
      </tr>
    \`).join('');
  }
}

async function runBenchmarks() {
  showToast('Running live speed benchmarking race across all providers...', 'info');
  try {
    const res = await fetch('/api/benchmarks/run', { method: 'POST' });
    const data = await res.json();
    showToast('Benchmarking race completed!', 'success');
    await loadBenchmarks();
  } catch (err) {
    showToast('Benchmarking failed: ' + err.message, 'error');
  }
}

async function loadLogs() {
  try {
    const res = await fetch('/api/logs');
    if (!res.ok) return;
    state.logs = await res.json();
    renderLogs();
  } catch (err) {
    console.warn('[Logs] Load error:', err);
  }
}

function renderLogs() {
  const tbody = document.getElementById('logs-table-body');
  if (!tbody) return;

  if (state.logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan=\"7\" class=\"text-center py-4\">No telemetry logs recorded yet. Send a request to see live logs!</td></tr>';
    return;
  }

  tbody.innerHTML = state.logs.slice(0, 50).map(l => \`
    <tr>
      <td>\${new Date(l.timestamp).toLocaleTimeString()}</td>
      <td><code>\${l.requested_model}</code></td>
      <td><span class=\"badge-cyan\">\${l.provider || 'router'}</span></td>
      <td>\${l.prompt_tokens} / \${l.completion_tokens}</td>
      <td>\${l.latency_ms}ms</td>
      <td><span class=\"badge-\${l.status_code === 200 ? 'neon' : 'amber'}\">\${l.status_code}</span></td>
      <td><span class=\"badge-neon\">Saved $\${((l.prompt_tokens + l.completion_tokens) * 0.000005).toFixed(4)}</span></td>
    </tr>
  \`).join('');
}

async function loadWebhooks() {
  try {
    const res = await fetch('/api/webhooks');
    if (!res.ok) return;
    state.webhooks = await res.json();
    renderWebhooks();
  } catch (err) {
    console.warn('[Webhooks] Load error:', err);
  }
}

function renderWebhooks() {
  const container = document.getElementById('webhooks-container');
  if (!container) return;

  if (state.webhooks.length === 0) {
    container.innerHTML = '<div class=\"empty-state\">No webhooks configured. Register a webhook to receive real-time alerts.</div>';
    return;
  }

  container.innerHTML = state.webhooks.map(w => \`
    <div class=\"webhook-card card-glass\">
      <div class=\"webhook-header\">
        <h4>\${w.url}</h4>
        <span class=\"badge-\${w.active ? 'neon' : 'amber'}\">\${w.active ? 'Active' : 'Paused'}</span>
      </div>
      <p>Events: <code>\${w.events}</code></p>
      <div class=\"webhook-actions\">
        <button class=\"btn-delete-sm\" onclick=\"deleteWebhook('\${w.id}')\">🗑 Remove</button>
      </div>
    </div>
  \`).join('');
}

function loadTelemetryAndStats() {
  loadStats();
  if (state.activeTab === 'tab-logs') loadLogs();
}

/* ==========================================================================
   Utilities
   ========================================================================== */
window.copyToClipboard = function(text, msg = 'Copied to clipboard!') {
  navigator.clipboard.writeText(text).then(() => {
    showToast(msg, 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
};

function copySnippet(id) {
  const el = document.getElementById(id);
  if (el) copyToClipboard(el.textContent, 'Snippet copied!');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = \`toast toast-\${type}\`;
  toast.innerHTML = \`<span>\${message}</span>\`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
}

function initThemeToggle() {
  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    showToast('Neon Cyberpunk theme active', 'info');
  });
}

function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      showToast('Shortcuts: 1-Cockpit, 2-Providers, 3-Models, 4-Keys, 5-Integrations, 6-Playground', 'info');
    }
  });
}
`;

fs.writeFileSync(path.join(rootDir, 'public', 'js', 'app.js'), appJs, 'utf8');
console.log('app.js written successfully in UTF-8');
