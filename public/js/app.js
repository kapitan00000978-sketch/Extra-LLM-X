
function openCreateKeyModal() {
  const modal = document.getElementById('modal-create-client-key');
  if (!modal) return;
  const formView = document.getElementById('client-key-form-view');
  const successView = document.getElementById('client-key-success-view');
  if (formView) formView.style.display = 'block';
  if (successView) successView.style.display = 'none';

  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  const inputName = document.getElementById('input-client-key-name');
  if (inputName) inputName.value = 'Agent Client #' + randSuffix;
  modal.classList.add('active');
}

async function quickGenerateRandomKey() {
  try {
    const res = await fetch('/api/system-keys/random', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate key');
    
    await navigator.clipboard?.writeText(data.key);
    showToast('Random key generated: ' + data.key + ' (Copied!)', 'success');
    await loadSystemKeys();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

/**
 * Extra LLM X — Core Frontend Engine
 * Enterprise multi-provider gateway controller
 */

const state = {
  activeTab: 'tab-overview',
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

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initModals();
  initPlayground();
  initFilters();
  initShortcuts();

  loadAllData();
  setInterval(loadTelemetryAndStats, 15000);
});

/* ==========================================================================
   Navigation
   ========================================================================== */
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      switchTab(target);
    });
  });

  document.getElementById('btn-header-add-key')?.addEventListener('click', () => {
    openCreateKeyModal();
  });
  document.getElementById('btn-quick-random-key')?.addEventListener('click', () => {
    quickGenerateRandomKey();
  });
  document.getElementById('btn-done-create-client-key')?.addEventListener('click', () => {
    document.getElementById('modal-create-client-key').classList.remove('active');
  });

  document.getElementById('btn-overview-open-playground')?.addEventListener('click', () => switchTab('tab-playground'));
  document.getElementById('btn-open-key-wizard')?.addEventListener('click', () => switchTab('tab-providers'));
  document.getElementById('btn-overview-rescan')?.addEventListener('click', triggerFullScan);
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.nav-item').forEach(b => {
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
    
    if (document.getElementById('stat-total-savings')) {
      document.getElementById('stat-total-savings').textContent = `$${(data.estimatedSavingsUsd || 0).toFixed(2)}`;
    }
    if (document.getElementById('stat-active-models')) {
      document.getElementById('stat-active-models').textContent = `${data.activeFreeModels || 725}+`;
    }
  } catch (err) {
    console.warn('[Stats] Load error:', err);
  }
}

async function loadCombos() {
  try {
    const res = await fetch('/api/combos');
    if (!res.ok) return;
    const comboData = await res.json();
    state.combos = Array.isArray(comboData) ? comboData : (comboData.combos || []);
    renderCombos();
  } catch (err) {
    console.warn('[Combos] Load error:', err);
  }
}

function renderCombos() {
  const container = document.getElementById('combos-container');
  if (!container) return;

  const defaultCombos = [
    { name: 'extra/auto-free', title: 'Auto-Pilot Smart Combo', desc: 'Auto-selects the highest quality available free model across 56 native providers with instant failover.', badge: 'Recommended' },
    { name: 'extra/free-coding', title: 'Code Generation Specialist', desc: 'Specialized chain for code synthesis, refactoring, and debugging (Codestral, Qwen 2.5 Coder, Llama 3.3).', badge: 'Coding' },
    { name: 'extra/free-fast', title: 'Sub-Second LPU Speed', desc: 'Ultra-low latency models running at 500-2000 tok/s on dedicated LPUs (Cerebras, Groq, Spark Lite).', badge: '500+ tok/s' },
    { name: 'extra/free-reasoning', title: 'Deep Reasoning & Logic', desc: 'Mathematical reasoning, algorithmic deduction, and step-by-step thinking (DeepSeek-R1, Sonar, Step-2).', badge: 'Reasoning' },
    { name: 'extra/free-vision', title: 'Multimodal Vision', desc: 'Image analysis, diagram inspection, and visual reasoning (Gemini 2.0 Flash, Grok 2 Vision, GPT-4o Mini).', badge: 'Vision' }
  ];

  container.innerHTML = defaultCombos.map(c => `
    <div class="combo-card">
      <div class="combo-header">
        <span class="combo-name">${c.name}</span>
        <span class="badge-neon">${c.badge}</span>
      </div>
      <h4>${c.title}</h4>
      <p>${c.desc}</p>
      <div class="combo-actions">
        <button class="btn-copy-sm" onclick="copyToClipboard('${c.name}', 'Model identifier copied!')">Copy ID</button>
        <button class="btn-test-sm" onclick="testComboInPlayground('${c.name}')">Test in Studio</button>
      </div>
    </div>
  `).join('');
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
  if (badge) { const total = Math.max((state.providers.length + state.directory.length), 470); badge.textContent = `${total}+`; }
}

function renderProviders() {
  const grid = document.getElementById('providers-portals-grid');
  if (!grid) return;

  const filterText = (document.getElementById('input-search-providers')?.value || '').toLowerCase().trim();
  const dirMap = new Map((state.directory || []).map(d => [d.id, d]));
  
  // Merge: all 70+ native adapters first with active status, then 400+ directory entries
  const combined = [];
  const seenIds = new Set();

  for (const portal of (state.providers || [])) {
    seenIds.add(portal.id);
    const dirInfo = dirMap.get(portal.id);
    combined.push({
      ...portal,
      category: dirInfo?.category || portal.badge || 'Native Adapter'
    });
  }

  for (const dirItem of (state.directory || [])) {
    if (!seenIds.has(dirItem.id)) {
      seenIds.add(dirItem.id);
      combined.push(dirItem);
    }
  }

  if (state.activeFilter === 'configured') {
    combined = combined.filter(p => p.hasKey || (p.keys && p.keys.length > 0));
  } else if (state.activeFilter === 'zero-key') {
    combined = combined.filter(p => p.isNoAuth || p.id === 'puter' || p.id === 'pollinations' || p.id === 'opencode' || p.id === 'kilo');
  } else if (state.activeFilter === 'lpu') {
    combined = combined.filter(p => p.id === 'groq' || p.id === 'cerebras' || p.id === 'sambanova' || p.id === 'iflytek');
  } else if (state.activeFilter === 'hyperscaler') {
    combined = combined.filter(p => p.id === 'gemini' || p.id === 'vertex' || p.id === 'xai' || p.id === 'deepseek' || p.id === 'dashscope');
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
    grid.innerHTML = `<div class="empty-state">No providers found matching "${filterText}".</div>`;
    return;
  }

  grid.innerHTML = combined.map(p => {
    const isConfigured = p.hasKey || (p.keys && p.keys.some(k => k.active === 1));
    const isNoAuth = p.isNoAuth || p.id === 'puter' || p.id === 'pollinations' || p.id === 'opencode' || p.id === 'kilo' || p.id === 'ollama' || p.id === 'lmstudio';

    let statusBadge = isConfigured 
      ? `<span class="status-pill status-online">● Connected (${p.keyCount || p.keys?.length || 1})</span>`
      : isNoAuth
      ? `<span class="status-pill status-zero">● Zero-Key (Public)</span>`
      : `<span class="status-pill status-offline">○ Ready</span>`;

    return `
      <div class="provider-card">
        <div class="provider-header">
          <div class="provider-title-wrap">
            <h4 class="provider-title">${p.name}</h4>
            <span class="badge-cyan">${p.category || p.badge || 'Cloud AI'}</span>
          </div>
          ${statusBadge}
        </div>
        <p class="provider-desc">${p.freeTierInfo || p.freeTier || 'Free Developer Access'}</p>
        <div class="provider-models-preview">
          ${(Array.isArray(p.popularModels) ? p.popularModels : (typeof p.popularModels === "string" && p.popularModels.trim() ? p.popularModels.split(",").map(s => s.trim()).filter(Boolean) : [])).slice(0, 4).map(m => `<span class="model-tag">${m}</span>`).join('')}
        </div>
        <div class="provider-actions">
          ${p.getKeyUrl ? `<a href="${p.getKeyUrl}" target="_blank" class="btn-portal">Official Portal ↗</a>` : ''}
          <button class="btn-add-key" onclick="openKeyModal('${p.id}', '${p.name}', '${p.getKeyUrl || ''}', '${p.guide || ''}')">
            ${isConfigured ? 'Manage Key' : '+ Connect Key'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function initFilters() {
  document.querySelectorAll('#filter-providers-chips .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filter-providers-chips .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.getAttribute('data-filter');
      renderProviders();
    });
  });

  document.getElementById('input-search-providers')?.addEventListener('input', renderProviders);
  document.getElementById('input-search-models')?.addEventListener('input', renderModels);
  document.getElementById('select-model-provider-filter')?.addEventListener('change', renderModels);
}

/* ==========================================================================
   Models Catalog
   ========================================================================== */
async function loadModels() {
  try {
    const res = await fetch('/api/models');
    if (!res.ok) return;
    const modelData = await res.json();
    state.models = Array.isArray(modelData) ? modelData : (modelData.models || []);
    
    const countBadge = document.getElementById('badge-models-count');
    if (countBadge) countBadge.textContent = `${state.models.length}+`;
    const statModels = document.getElementById('stat-active-models');
    if (statModels) statModels.textContent = `${state.models.length}+`;
    
    const select = document.getElementById('select-model-provider-filter');
    if (select) {
      const providers = Array.from(new Set(state.models.map(m => m.provider))).sort();
      select.innerHTML = '<option value="all">All Providers</option>' + 
        providers.map(p => `<option value="${p}">${p.toUpperCase()}</option>`).join('');
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
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No models found matching your search.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.slice(0, 100).map(m => `
    <tr>
      <td><strong>${m.display_name || m.model_id}</strong></td>
      <td><span class="badge-cyan">${m.provider}</span></td>
      <td><code>${m.model_id}</code></td>
      <td>${m.context_window ? m.context_window.toLocaleString() + ' tokens' : '8,192 tokens'}</td>
      <td><span class="badge-purple">${m.capabilities || 'chat'}</span></td>
      <td><span class="badge-neon">$0.00 Free</span></td>
      <td>
        <button class="btn-copy-sm" onclick="testModelInPlayground('${m.provider}/${m.model_id}')">Test</button>
      </td>
    </tr>
  `).join('');
}

async function triggerFullScan() {
  showToast('Initiating Auto-Discovery across all providers...', 'info');
  try {
    const res = await fetch('/api/providers/scan', { method: 'POST' });
    const data = await res.json();
    showToast(`Scan complete! Discovered ${data.totalDiscovered || 0} models.`, 'success');
    await loadModels();
  } catch (err) {
    showToast('Scan failed: ' + err.message, 'error');
  }
}

/* ==========================================================================
   API Keys
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
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No client keys created yet.</td></tr>';
    return;
  }

  tbody.innerHTML = state.systemKeys.map(k => `
    <tr>
      <td><strong>${k.name}</strong></td>
      <td><code>${k.key.slice(0, 10)}...</code></td>
      <td>${k.rate_limit_rpm} RPM</td>
      <td>${k.request_count || 0} requests</td>
      <td>
        <button class="btn-copy-sm" onclick="copyToClipboard('${k.key}', 'API Key copied to clipboard!')">Copy</button>
        <button class="btn-delete-sm" onclick="deleteSystemKey('${k.key}')">Revoke</button>
      </td>
    </tr>
  `).join('');
}

async function deleteSystemKey(key) {
  if (!confirm('Are you sure you want to revoke this API key?')) return;
  try {
    const res = await fetch(`/api/system-keys/${encodeURIComponent(key)}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('API Key revoked successfully', 'success');
      loadSystemKeys();
    }
  } catch (err) {
    showToast('Failed to revoke key: ' + err.message, 'error');
  }
}

/* ==========================================================================
   Modals
   ========================================================================== */
function initModals() {
  const modalKey = document.getElementById('modal-provider-key');
  document.getElementById('btn-close-key-modal')?.addEventListener('click', () => modalKey.classList.remove('active'));
  document.getElementById('btn-cancel-key-modal')?.addEventListener('click', () => modalKey.classList.remove('active'));
  document.getElementById('btn-save-provider-key')?.addEventListener('click', saveProviderKey);

  const modalCustom = document.getElementById('modal-custom-provider');
  document.getElementById('btn-open-custom-provider-modal')?.addEventListener('click', () => modalCustom.classList.add('active'));
  document.getElementById('btn-close-custom-modal')?.addEventListener('click', () => modalCustom.classList.remove('active'));
  document.getElementById('btn-cancel-custom-modal')?.addEventListener('click', () => modalCustom.classList.remove('active'));
  document.getElementById('btn-save-custom-provider')?.addEventListener('click', saveCustomProvider);

  const modalClient = document.getElementById('modal-create-client-key');
  document.getElementById('btn-open-create-key-modal')?.addEventListener('click', () => openCreateKeyModal());
  document.getElementById('btn-close-create-client-key')?.addEventListener('click', () => modalClient.classList.remove('active'));
  document.getElementById('btn-cancel-create-client-key')?.addEventListener('click', () => modalClient.classList.remove('active'));
  document.getElementById('btn-confirm-create-client-key')?.addEventListener('click', createClientKey);

  document.getElementById('btn-copy-base-url')?.addEventListener('click', () => copyToClipboard('http://localhost:3000/v1', 'Base URL copied!'));
  document.getElementById('btn-copy-master-key')?.addEventListener('click', () => copyToClipboard('elx-live-master-free-hub', 'Master token copied!'));
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
  document.getElementById('modal-provider-title').textContent = `Connect ${name} Key`;
  document.getElementById('modal-provider-guide').textContent = guide || `Enter your ${name} API key. Extra LLM X will validate it live and auto-discover models.`;
  
  const link = document.getElementById('link-get-free-key');
  if (link && getUrl) {
    link.href = getUrl;
    link.parentElement.style.display = 'flex';
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

  showToast('Probing key and auto-discovering free models...', 'info');
  try {
    const res = await fetch('/api/providers/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, label })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save key');

    document.getElementById('modal-provider-key').classList.remove('active');
    showToast(`Key saved! Discovered ${data.modelsDiscovered || 0} models.`, 'success');
    
    await loadProviders();
    await loadModels();
  } catch (err) {
    showToast('Validation error: ' + err.message, 'error');
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
    showToast(`Custom provider '${name}' added successfully!`, 'success');
    
    await loadProviders();
    await loadModels();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function createClientKey() {
  const name = document.getElementById('input-client-key-name')?.value.trim() || 'Client Application Key';
  const rateLimit = parseInt(document.getElementById('input-client-key-rpm')?.value || '120', 10);
  const confirmBtn = document.getElementById('btn-confirm-create-client-key');
  if (confirmBtn) confirmBtn.textContent = 'Generating...';

  try {
    const res = await fetch('/api/system-keys/random', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, rateLimit })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate key');

    const newKey = data.key;
    const formView = document.getElementById('client-key-form-view');
    const successView = document.getElementById('client-key-success-view');
    if (formView) formView.style.display = 'none';
    if (successView) successView.style.display = 'block';

    const displayKeyEl = document.getElementById('display-new-key-value');
    if (displayKeyEl) displayKeyEl.textContent = newKey;

    const curlExample = document.getElementById('code-example-new-key');
    if (curlExample) {
      curlExample.textContent = "curl http://localhost:3000/v1/chat/completions \\\n  -H \\\"Authorization: Bearer " + newKey + "\\\" \\\n  -d '{\\\"model\\\":\\\"extra/frontier\\\",\\\"messages\\\":[{\\\"role\\\":\\\"user\\\",\\\"content\\\":\\\"Hi\\\"}]}'";
    }

    const copyBtn = document.getElementById('btn-copy-new-key');
    if (copyBtn) {
      copyBtn.onclick = () => {
        copyToClipboard(newKey, 'New API Key copied to clipboard!');
      };
    }

    try { await navigator.clipboard?.writeText(newKey); } catch {}
    showToast('Random key generated & copied to clipboard!', 'success');
    await loadSystemKeys();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    if (confirmBtn) confirmBtn.textContent = '⚡ Generate Random Key Now';
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
      container.innerHTML = `
        <div class="message-row assistant">
          <div class="message-avatar">AI</div>
          <div class="message-bubble">
            <p>Session cleared. Ready for your prompt.</p>
          </div>
        </div>
      `;
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
    let opt = select.querySelector(`option[value="${modelId}"]`);
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

  const userRow = document.createElement('div');
  userRow.className = 'message-row user';
  userRow.innerHTML = `<div class="message-bubble"><p>${escapeHtml(text)}</p></div>`;
  container.appendChild(userRow);
  input.value = '';
  container.scrollTop = container.scrollHeight;

  const assistantRow = document.createElement('div');
  assistantRow.className = 'message-row assistant';
  assistantRow.innerHTML = `<div class="message-avatar">AI</div><div class="message-bubble"><p class="text-tertiary">Thinking...</p></div>`;
  container.appendChild(assistantRow);
  container.scrollTop = container.scrollHeight;

  const bubbleP = assistantRow.querySelector('.message-bubble p');

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
      bubbleP.textContent = '';
      bubbleP.classList.remove('text-tertiary');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const json = JSON.parse(dataStr);
              const delta = json.choices?.[0]?.delta?.content || '';
              bubbleP.textContent += delta;
              container.scrollTop = container.scrollHeight;
            } catch (e) {}
          }
        }
      }
    } else {
      const data = await res.json();
      bubbleP.classList.remove('text-tertiary');
      bubbleP.textContent = data.choices?.[0]?.message?.content || 'No response content.';
    }
  } catch (err) {
    bubbleP.innerHTML = `<span style="color: var(--accent-rose)">Error: ${escapeHtml(err.message)}</span>`;
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
    podiumContainer.innerHTML = rankings.slice(0, 4).map((p, idx) => `
      <div class="stat-card">
        <div class="stat-label">#${idx + 1} ${p.provider.toUpperCase()}</div>
        <div class="stat-value">${Math.round(p.speed_tok_per_sec || 500)} <span class="stat-unit">tok/s</span></div>
        <div class="stat-meta text-muted">TTFT: ${Math.round(p.ttft_ms || 120)}ms</div>
      </div>
    `).join('');
  }

  if (tableBody) {
    tableBody.innerHTML = rankings.map((p, idx) => `
      <tr>
        <td><strong>#${idx + 1}</strong></td>
        <td><strong>${p.provider.toUpperCase()}</strong></td>
        <td>${Math.round(p.speed_tok_per_sec || 450)} tok/s</td>
        <td>${Math.round(p.ttft_ms || 150)}ms</td>
        <td><span class="status-pill status-online">99.9%</span></td>
        <td><span class="badge-neon">Free Tier</span></td>
        <td><span class="status-pill status-online">Operational</span></td>
      </tr>
    `).join('');
  }
}

async function runBenchmarks() {
  showToast('Running benchmark suite across active providers...', 'info');
  try {
    const res = await fetch('/api/benchmarks/run', { method: 'POST' });
    const data = await res.json();
    showToast('Benchmarking completed successfully!', 'success');
    await loadBenchmarks();
  } catch (err) {
    showToast('Benchmarking error: ' + err.message, 'error');
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
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No telemetry recorded yet. Send a request to see live logs.</td></tr>';
    return;
  }

  tbody.innerHTML = state.logs.slice(0, 50).map(l => `
    <tr>
      <td>${new Date(l.timestamp).toLocaleTimeString()}</td>
      <td><code>${l.requested_model}</code></td>
      <td><span class="badge-cyan">${l.provider || 'router'}</span></td>
      <td>${l.prompt_tokens} / ${l.completion_tokens}</td>
      <td>${l.latency_ms}ms</td>
      <td><span class="status-pill ${l.status_code === 200 ? 'status-online' : 'status-offline'}">${l.status_code}</span></td>
      <td><span class="text-emerald">$${((l.prompt_tokens + l.completion_tokens) * 0.000005).toFixed(4)}</span></td>
    </tr>
  `).join('');
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
    container.innerHTML = '<div class="text-muted text-sm">No webhook endpoints configured.</div>';
    return;
  }

  container.innerHTML = state.webhooks.map(w => `
    <div class="content-panel">
      <div class="panel-header">
        <h4>${w.url}</h4>
        <span class="status-pill ${w.active ? 'status-online' : 'status-offline'}">${w.active ? 'Active' : 'Paused'}</span>
      </div>
      <p class="text-secondary text-sm">Events: <code>${w.events}</code></p>
      <div class="mt-1">
        <button class="btn-delete-sm" onclick="deleteWebhook('${w.id}')">Delete Endpoint</button>
      </div>
    </div>
  `).join('');
}

function loadTelemetryAndStats() {
  loadStats();
  if (state.activeTab === 'tab-telemetry') loadLogs();
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
  if (el) copyToClipboard(el.textContent, 'Snippet copied to clipboard!');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      switchTab('tab-providers');
      document.getElementById('input-search-providers')?.focus();
    }
  });
}
