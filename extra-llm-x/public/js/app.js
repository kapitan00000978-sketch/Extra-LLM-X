// Extra LLM X — Frontend Controller & Telemetry Engine

const API_BASE = window.location.origin;

let allModels = [];
let allCombos = [];
let activeFilter = 'all';
let currentChatHistory = [];
let isGenerating = false;

const navTabs = document.querySelectorAll('.nav-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const toastContainer = document.getElementById('toast-container');

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initCopyButtons();
  initModals();
  initFilters();
  initPlayground();

  loadStats();
  loadProviders();
  loadModels();
  loadSystemKeys();
  loadLogs();

  setInterval(loadStats, 4000);
  setInterval(loadLogs, 6000);
});

function initTabs() {
  navTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      navTabs.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');

      if (targetId === 'tab-models') loadModels();
      if (targetId === 'tab-providers') loadProviders();
      if (targetId === 'tab-keys') loadSystemKeys();
      if (targetId === 'tab-logs') loadLogs();
    });
  });

  document.getElementById('btn-hero-add-provider')?.addEventListener('click', () => switchTab('tab-providers'));
  document.getElementById('btn-hero-gen-key')?.addEventListener('click', () => {
    switchTab('tab-keys');
    openSysKeyModal();
  });
  document.getElementById('btn-hero-open-universal')?.addEventListener('click', () => switchTab('tab-universal'));
}

function switchTab(tabId) {
  const btn = document.querySelector(`[data-tab="${tabId}"]`);
  if (btn) btn.click();
}

async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (!res.ok) return;
    const stats = await res.json();

    document.getElementById('stat-total-tokens').textContent = Number(stats.totalTokens || 0).toLocaleString();
    document.getElementById('stat-saved-usd').textContent = `$${stats.estimatedSavedUsd || '0.0000'}`;
    document.getElementById('stat-active-models').textContent = stats.activeModelsCount || 0;
    document.getElementById('badge-models-count').textContent = stats.activeModelsCount || 0;
    document.getElementById('stat-total-fallbacks').textContent = stats.totalFallbacks || 0;

    const resilienceRate = stats.totalRequests > 0
      ? Math.round((stats.successfulRequests / stats.totalRequests) * 100)
      : 100;
    document.getElementById('stat-resilience').textContent = `${resilienceRate}%`;
  } catch (err) {
    console.warn('Stats error:', err.message);
  }
}

async function loadProviders() {
  try {
    const [portalsRes, keysRes] = await Promise.all([
      fetch(`${API_BASE}/api/providers/portals`),
      fetch(`${API_BASE}/api/providers/keys`)
    ]);

    const portals = await portalsRes.json();
    const keys = await keysRes.json();

    document.getElementById('badge-providers-count').textContent = portals.length;
    renderProvidersGrid(portals);
    renderProviderKeysTable(keys);
  } catch (err) {
    showToast('Failed to load providers: ' + err.message, 'error');
  }
}

function renderProvidersGrid(portals) {
  const container = document.getElementById('providers-grid');
  if (!container) return;

  container.innerHTML = portals.map(p => {
    const isReady = p.status === 'ready';
    const isActive = p.status === 'active';
    let statusText = '⚪ No Key Added';
    if (isReady) statusText = '🟢 Ready (Local / Demo)';
    else if (isActive) statusText = `🟢 ${p.activeKeysCount} Key(s) Active`;

    const isLocalOrMock = p.id === 'ollama' || p.id === 'lmstudio' || p.id === 'mock';

    return `
      <div class="provider-card ${isActive || isReady ? 'status-active' : ''}">
        <div>
          <div class="provider-card-header">
            <h3 class="provider-name">${p.name}</h3>
            <span class="provider-badge-pill">${p.badge}</span>
          </div>
          <div class="provider-limits">⚡ ${p.freeTierInfo}</div>
          <div class="provider-popular">Models: ${p.popularModels}</div>
        </div>

        <div>
          <div class="provider-keys-summary">
            <span>Status:</span>
            <strong>${statusText}</strong>
          </div>

          <div class="provider-card-actions">
            ${!isLocalOrMock ? `
              <button class="btn-primary" style="padding: 0.45rem 0.9rem; font-size: 0.8rem;" onclick="openAddKeyModal('${p.id}', '${p.name}', '${p.guide}')">
                + Add Key
              </button>
            ` : `
              <button class="btn-secondary" style="padding: 0.45rem 0.9rem; font-size: 0.8rem;" onclick="scanProviders()">
                🔄 Scan
              </button>
            `}
            ${p.getKeyUrl !== '#' ? `
              <a href="${p.getKeyUrl}" target="_blank" rel="noopener noreferrer" class="btn-get-free-key">
                Get Free Key ↗
              </a>
            ` : `<span style="font-size: 0.78rem; color: var(--accent-cyan);">Zero-Key Ready</span>`}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderProviderKeysTable(keys) {
  const tbody = document.getElementById('tbody-provider-keys');
  if (!tbody) return;

  if (keys.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No external provider keys added yet. System is currently running in Zero-Key Demo mode with full route simulation.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = keys.map(k => {
    const isCool = k.cooldown_until && k.cooldown_until > Date.now();
    const coolText = isCool ? `⏳ Cooldown (${Math.ceil((k.cooldown_until - Date.now()) / 1000)}s)` : '🟢 Ready';

    return `
      <tr>
        <td><strong>${k.provider.toUpperCase()}</strong></td>
        <td>${k.label || '-'}</td>
        <td><code style="font-family: var(--font-mono); color: var(--accent-cyan);">${k.api_key_masked}</code></td>
        <td>
          <span class="status-tag ${k.active ? 'active' : 'inactive'}">
            ${k.active ? 'Active' : 'Disabled'}
          </span>
        </td>
        <td>${coolText}</td>
        <td>
          <button class="btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.75rem;" onclick="toggleProviderKey('${k.id}', ${k.active ? 0 : 1})">
            ${k.active ? 'Disable' : 'Enable'}
          </button>
          <button class="btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.75rem; color: #ef4444;" onclick="deleteProviderKey('${k.id}')">
            Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.deleteProviderKey = async function(id) {
  if (!confirm('Are you sure you want to delete this provider key?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/providers/keys/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Provider key deleted', 'success');
      loadProviders();
    }
  } catch (err) {
    showToast('Failed to delete key: ' + err.message, 'error');
  }
};

window.toggleProviderKey = async function(id, active) {
  try {
    const res = await fetch(`${API_BASE}/api/providers/keys/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: active === 1 })
    });
    if (res.ok) loadProviders();
  } catch (err) {
    showToast('Failed to toggle key: ' + err.message, 'error');
  }
};

async function loadModels() {
  try {
    const res = await fetch(`${API_BASE}/api/models`);
    const data = await res.json();
    allModels = data.models || [];
    allCombos = data.combos || [];

    renderCombos(allCombos);
    renderModels(allModels);
    populatePlaygroundModels(allCombos, allModels);
  } catch (err) {
    showToast('Failed to load models: ' + err.message, 'error');
  }
}

function renderCombos(combos) {
  const container = document.getElementById('combos-grid');
  if (!container) return;

  container.innerHTML = combos.map(c => `
    <div class="combo-card">
      <div>
        <span class="combo-badge">100% FREE FAILOVER COMBO</span>
        <h3 class="combo-title">${c.display_name}</h3>
        <div class="combo-id">Model ID: ${c.id}</div>
        <p class="combo-desc">${c.description}</p>
      </div>

      <div>
        <div class="combo-chain">
          <div class="combo-chain-title">Automatic Failover Route Chain:</div>
          <div class="chain-steps">
            ${c.targets.slice(0, 5).map((t, idx) => `
              <span class="chain-step">${t.provider}/${t.model.split('/').pop()}</span>
              ${idx < Math.min(4, c.targets.length - 1) ? '<span class="chain-arrow">→</span>' : ''}
            `).join('')}
          </div>
        </div>

        <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
          <button class="btn-primary" style="flex: 1; padding: 0.45rem; font-size: 0.78rem;" onclick="useModelInPlayground('${c.id}')">
            Test in Playground
          </button>
          <button class="btn-secondary" style="padding: 0.45rem 0.75rem; font-size: 0.78rem;" onclick="copyText('${c.id}')">
            Copy ID
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderModels(models) {
  const container = document.getElementById('models-grid');
  if (!container) return;

  const search = (document.getElementById('input-model-search')?.value || '').toLowerCase();

  const filtered = models.filter(m => {
    const matchesFilter = activeFilter === 'all' || (m.capabilities && m.capabilities.includes(activeFilter));
    const matchesSearch = !search ||
      m.display_name.toLowerCase().includes(search) ||
      m.model_id.toLowerCase().includes(search) ||
      m.provider.toLowerCase().includes(search);
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">
        No free models found matching the filter. Click "Scan & Refresh Models" above!
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(m => `
    <div class="model-card">
      <div>
        <div class="model-header">
          <h4 class="model-name">${m.display_name}</h4>
          <span class="provider-badge-pill" style="font-size: 0.65rem;">${m.provider.toUpperCase()}</span>
        </div>
        <div class="model-id-pill">${m.id}</div>
        <div class="model-tags">
          <span class="model-tag free-tag">100% FREE</span>
          <span class="model-tag context-tag">${Math.round((m.context_window || 8192) / 1024)}k Context</span>
          ${(m.capabilities || 'chat').split(',').map(c => `<span class="model-tag">${c.trim()}</span>`).join('')}
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <button class="btn-primary" style="flex: 1; padding: 0.4rem; font-size: 0.78rem;" onclick="useModelInPlayground('${m.id}')">
          Playground 💬
        </button>
        <button class="btn-secondary" style="padding: 0.4rem 0.65rem; font-size: 0.78rem;" onclick="copyText('${m.id}')">
          Copy
        </button>
      </div>
    </div>
  `).join('');
}

function initFilters() {
  const pills = document.querySelectorAll('#model-filter-pills .filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.getAttribute('data-filter');
      renderModels(allModels);
    });
  });

  document.getElementById('input-model-search')?.addEventListener('input', () => {
    renderModels(allModels);
  });

  document.getElementById('btn-scan-all-providers')?.addEventListener('click', scanProviders);
}

async function scanProviders() {
  const btn = document.getElementById('btn-scan-all-providers');
  if (btn) btn.innerHTML = '🔄 Scanning...';

  try {
    const res = await fetch(`${API_BASE}/api/models/scan`, { method: 'POST' });
    const data = await res.json();
    showToast(`Scan complete: Discovered ${data.totalActiveFreeModels} free models!`, 'success');
    await loadModels();
    await loadStats();
  } catch (err) {
    showToast('Scan error: ' + err.message, 'error');
  } finally {
    if (btn) btn.innerHTML = '🔄 Scan & Refresh Models';
  }
}

async function loadSystemKeys() {
  try {
    const res = await fetch(`${API_BASE}/api/system-keys`);
    const keys = await res.json();
    renderSystemKeysTable(keys);
  } catch (err) {
    showToast('Failed to load client keys: ' + err.message, 'error');
  }
}

function renderSystemKeysTable(keys) {
  const tbody = document.getElementById('tbody-system-keys');
  if (!tbody) return;

  tbody.innerHTML = keys.map(k => `
    <tr>
      <td><strong>${k.name}</strong></td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <code style="font-family: var(--font-mono); color: var(--accent-cyan);">${k.key}</code>
          <button class="btn-copy-small" onclick="copyText('${k.key}')" title="Copy Key">📋</button>
        </div>
      </td>
      <td>${k.rate_limit_rpm} req/min</td>
      <td>${Number(k.request_count || 0).toLocaleString()}</td>
      <td>${Number(k.total_tokens || 0).toLocaleString()}</td>
      <td>
        <span class="status-tag ${k.active ? 'active' : 'inactive'}">
          ${k.active ? 'Active' : 'Revoked'}
        </span>
      </td>
      <td>
        <button class="btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.75rem; color: #ef4444;" onclick="deleteSystemKey('${k.key}')">
          Revoke
        </button>
      </td>
    </tr>
  `).join('');
}

window.deleteSystemKey = async function(key) {
  if (!confirm(`Revoke key ${key}? Universal Agent using this key will lose access.`)) return;
  try {
    const res = await fetch(`${API_BASE}/api/system-keys/${encodeURIComponent(key)}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Key revoked', 'success');
      loadSystemKeys();
    }
  } catch (err) {
    showToast('Failed to revoke key: ' + err.message, 'error');
  }
};

function initPlayground() {
  const tempSlider = document.getElementById('range-play-temp');
  const tempVal = document.getElementById('val-play-temp');
  if (tempSlider && tempVal) {
    tempSlider.addEventListener('input', () => {
      tempVal.textContent = tempSlider.value;
    });
  }

  const sendBtn = document.getElementById('btn-play-send');
  const msgInput = document.getElementById('input-play-message');

  sendBtn?.addEventListener('click', sendPlaygroundMessage);
  msgInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPlaygroundMessage();
    }
  });
}

function populatePlaygroundModels(combos, models) {
  const optCombos = document.getElementById('optgroup-combos');
  const optModels = document.getElementById('optgroup-models');
  if (!optCombos || !optModels) return;

  optCombos.innerHTML = combos.map(c => `
    <option value="${c.id}">${c.display_name} (${c.id})</option>
  `).join('');

  optModels.innerHTML = models.map(m => `
    <option value="${m.id}">${m.display_name}</option>
  `).join('');
}

window.useModelInPlayground = function(modelId) {
  switchTab('tab-playground');
  const select = document.getElementById('select-play-model');
  if (select) select.value = modelId;
};

async function sendPlaygroundMessage() {
  if (isGenerating) return;
  const input = document.getElementById('input-play-message');
  const text = (input?.value || '').trim();
  if (!text) return;

  const chatMessages = document.getElementById('play-chat-messages');
  const model = document.getElementById('select-play-model').value || 'extra/auto-free';
  const temperature = parseFloat(document.getElementById('range-play-temp').value || '0.7');
  const maxTokens = parseInt(document.getElementById('input-play-tokens').value || '512', 10);

  appendChatBubble('user', 'You', text);
  input.value = '';
  isGenerating = true;

  const assistantBubble = appendChatBubble('assistant', `⚡ Extra LLM X (${model})`, 'Thinking...');
  const contentEl = assistantBubble.querySelector('.bubble-content');

  currentChatHistory.push({ role: 'user', content: text });

  const startTime = Date.now();
  try {
    const res = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer elx-live-universal-agent-free-hub'
      },
      body: JSON.stringify({
        model,
        messages: currentChatHistory,
        stream: true,
        temperature,
        max_tokens: maxTokens
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `HTTP ${res.status}`);
    }

    const prov = res.headers.get('X-ExtraLLMX-Provider') || 'auto';
    const actualModel = res.headers.get('X-ExtraLLMX-Actual-Model') || model;
    const fallback = res.headers.get('X-ExtraLLMX-Fallback') === 'true';

    document.getElementById('tele-provider').textContent = prov.toUpperCase();
    document.getElementById('tele-model').textContent = actualModel;
    document.getElementById('tele-fallback').textContent = fallback ? 'YES (Auto-Rerouted)' : 'Direct';

    contentEl.textContent = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullReply = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const delta = data.choices?.[0]?.delta?.content || '';
            fullReply += delta;
            contentEl.textContent = fullReply;
            chatMessages.scrollTop = chatMessages.scrollHeight;
          } catch (e) {}
        }
      }
    }

    currentChatHistory.push({ role: 'assistant', content: fullReply });
    document.getElementById('tele-latency').textContent = `${Date.now() - startTime} ms`;
  } catch (err) {
    contentEl.textContent = `❌ Error: ${err.message}`;
    contentEl.style.color = '#ef4444';
  } finally {
    isGenerating = false;
  }
}

function appendChatBubble(role, sender, text) {
  const container = document.getElementById('play-chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerHTML = `
    <div class="bubble-header">${sender}</div>
    <div class="bubble-content">${escapeHtml(text)}</div>
  `;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

async function loadLogs() {
  try {
    const res = await fetch(`${API_BASE}/api/logs?limit=50`);
    if (!res.ok) return;
    const logs = await res.json();
    renderLogsTable(logs);
  } catch (err) {
    console.warn('Logs error:', err.message);
  }
}

function renderLogsTable(logs) {
  const tbody = document.getElementById('tbody-logs');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No requests recorded yet. Send queries from Universal Agent HP or the Playground!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const time = new Date(l.timestamp).toLocaleTimeString();
    const isSuccess = l.status_code === 200;

    return `
      <tr>
        <td>${time}</td>
        <td><code>${l.requested_model}</code></td>
        <td><strong>${(l.provider || '-').toUpperCase()}</strong></td>
        <td><code>${l.actual_model || '-'}</code></td>
        <td>${l.prompt_tokens} / ${l.completion_tokens}</td>
        <td>${l.latency_ms} ms</td>
        <td>
          <span class="status-tag ${isSuccess ? 'active' : 'inactive'}">
            ${l.status_code}
          </span>
        </td>
        <td>
          ${l.fallback_occurred ? '<span style="color: var(--accent-amber); font-weight: 700;">⚡ Failover</span>' : '<span style="color: var(--text-muted);">Direct</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

function initModals() {
  const modalAddKey = document.getElementById('modal-add-key');
  document.getElementById('btn-close-key-modal')?.addEventListener('click', () => modalAddKey.classList.remove('active'));
  document.getElementById('btn-modal-save-key')?.addEventListener('click', saveModalProviderKey);
  document.getElementById('btn-modal-test-key')?.addEventListener('click', testModalProviderKey);

  const modalSysKey = document.getElementById('modal-create-sys-key');
  document.getElementById('btn-open-create-key-modal')?.addEventListener('click', () => modalSysKey.classList.add('active'));
  document.getElementById('btn-close-sys-key-modal')?.addEventListener('click', () => modalSysKey.classList.remove('active'));
  document.getElementById('btn-cancel-sys-key')?.addEventListener('click', () => modalSysKey.classList.remove('active'));
  document.getElementById('btn-save-sys-key')?.addEventListener('click', createSystemKey);

  document.getElementById('btn-refresh-logs')?.addEventListener('click', () => {
    loadLogs();
    showToast('Logs refreshed', 'success');
  });
}

window.openAddKeyModal = function(providerId, providerName, guide) {
  const modal = document.getElementById('modal-add-key');
  document.getElementById('modal-key-provider').value = providerId;
  document.getElementById('modal-provider-badge').textContent = providerName;
  document.getElementById('modal-field-help').textContent = guide;
  document.getElementById('modal-input-key').value = '';
  document.getElementById('modal-input-label').value = '';
  document.getElementById('modal-test-output').classList.add('hidden');
  modal.classList.add('active');
};

function openSysKeyModal() {
  document.getElementById('modal-create-sys-key')?.classList.add('active');
}

async function saveModalProviderKey() {
  const provider = document.getElementById('modal-key-provider').value;
  const apiKey = document.getElementById('modal-input-key').value.trim();
  const label = document.getElementById('modal-input-label').value.trim();

  if (!apiKey) {
    showToast('Please enter an API key', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/providers/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, label })
    });

    if (res.ok) {
      showToast(`${provider.toUpperCase()} key saved successfully!`, 'success');
      document.getElementById('modal-add-key').classList.remove('active');
      loadProviders();
      loadModels();
      loadStats();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to save key', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function testModalProviderKey() {
  const provider = document.getElementById('modal-key-provider').value;
  const apiKey = document.getElementById('modal-input-key').value.trim();
  const outputEl = document.getElementById('modal-test-output');

  if (!apiKey) {
    showToast('Please paste a key to test', 'error');
    return;
  }

  outputEl.classList.remove('hidden');
  outputEl.className = 'modal-test-output';
  outputEl.textContent = 'Testing connection with live inference...';

  try {
    const res = await fetch(`${API_BASE}/api/providers/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey })
    });

    const data = await res.json();
    if (data.success) {
      outputEl.className = 'modal-test-output success';
      outputEl.textContent = `✅ Connection OK! Model: ${data.testedModel} (${data.latencyMs}ms). Reply: "${data.reply}"`;
    } else {
      outputEl.className = 'modal-test-output error';
      outputEl.textContent = `❌ Test Failed: ${data.error}`;
    }
  } catch (err) {
    outputEl.className = 'modal-test-output error';
    outputEl.textContent = `❌ Error: ${err.message}`;
  }
}

async function createSystemKey() {
  const name = document.getElementById('input-sys-key-name').value.trim();
  const rateLimit = parseInt(document.getElementById('input-sys-key-rate').value || '120', 10);

  try {
    const res = await fetch(`${API_BASE}/api/system-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || 'Universal Agent Key', rateLimit })
    });

    if (res.ok) {
      showToast('New Client API Key generated!', 'success');
      document.getElementById('modal-create-sys-key').classList.remove('active');
      loadSystemKeys();
    }
  } catch (err) {
    showToast('Failed to create key: ' + err.message, 'error');
  }
}

function initCopyButtons() {
  document.getElementById('btn-copy-base-url')?.addEventListener('click', () => copyText('http://localhost:3000/v1'));
  document.getElementById('btn-copy-quick-env')?.addEventListener('click', () => copyText(document.getElementById('snippet-quick-env')?.textContent));
  document.getElementById('btn-copy-guide-env')?.addEventListener('click', () => copyText(document.getElementById('guide-code-env')?.textContent));
  document.getElementById('btn-copy-guide-cli')?.addEventListener('click', () => copyText(document.getElementById('guide-code-cli')?.textContent));
  document.getElementById('btn-copy-guide-python')?.addEventListener('click', () => copyText(document.getElementById('guide-code-python')?.textContent));
  document.getElementById('btn-copy-guide-cursor')?.addEventListener('click', () => copyText(document.getElementById('guide-code-cursor')?.textContent));
}

window.copyText = function(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied: ${text.slice(0, 32)}...`, 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
};

function showToast(message, type = 'success') {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '⚡' : '⚠️'}</span>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
