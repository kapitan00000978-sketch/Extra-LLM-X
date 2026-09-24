// Extra LLM X — Next-Gen Frontend Controller & Telemetry Engine (OmniRoute Parity)

const API_BASE = window.location.origin;

// State Management
let allModels = [];
let allCombos = [];
let allPortals = [];
let allKeys = [];
let allRankings = [];
let allLogs = [];

let activeFilter = 'all';
let activeProviderFilter = 'all';
let selectedProviderDropdown = '';
let selectedSortOrder = 'context-desc';
let modelsCurrentPage = 1;
const modelsPerPage = 24;

let activeRankingsFilter = 'all';
let currentChatHistory = [];
let isGenerating = false;
let currentAbortController = null;

const navTabs = document.querySelectorAll('.nav-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const toastContainer = document.getElementById('toast-container');

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initCopyButtons();
  initModals();
  initFilters();
  initPlayground();
  initMatrixView();
  initHealthCheck();
  initHandshakeTester();
  initTelemetryActions();
  initKeyboardShortcuts();

  loadStats();
  loadCharts();
  loadProviders();
  loadHealth();
  loadModels();
  loadSystemKeys();
  loadRankings();
  loadLogs();

  setInterval(loadStats, 4000);
  setInterval(loadCharts, 10000);
  setInterval(loadHealth, 30000);
  setInterval(loadLogs, 6000);
});

// Tab Navigation
function initTabs() {
  navTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      navTabs.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');

      if (targetId === 'tab-models') renderFilteredModels();
      if (targetId === 'tab-providers') loadProviders();
      if (targetId === 'tab-keys') loadSystemKeys();
      if (targetId === 'tab-rankings') loadRankings();
      if (targetId === 'tab-logs') loadLogs();
    });
  });

  document.getElementById('btn-refresh-rankings')?.addEventListener('click', loadRankings);
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

// Cockpit Stats
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (!res.ok) return;
    const stats = await res.json();

    document.getElementById('stat-total-tokens').textContent = Number(stats.totalTokens || 0).toLocaleString();
    document.getElementById('stat-saved-usd').textContent = `$${stats.estimatedSavedUsd || '0.0000'}`;
    document.getElementById('stat-active-models').textContent = stats.activeModelsCount || '600+';
    document.getElementById('badge-models-count').textContent = stats.activeModelsCount || '600+';
    document.getElementById('stat-total-fallbacks').textContent = stats.totalFallbacks || 0;

    const resilienceRate = stats.totalRequests > 0
      ? Math.round((stats.successfulRequests / stats.totalRequests) * 100)
      : 100;
    document.getElementById('stat-resilience').textContent = `${resilienceRate}%`;

    // Semantic Cache stats
    try {
      const cRes = await fetch(`${API_BASE}/api/cache/stats`);
      if (cRes.ok) {
        const cStats = await cRes.json();
        const hitRateEl = document.getElementById('stat-cache-hit-rate');
        const savedTokensEl = document.getElementById('stat-cache-saved-tokens');
        if (hitRateEl) hitRateEl.textContent = cStats.hitRate || '0.0%';
        if (savedTokensEl) savedTokensEl.textContent = Number(cStats.tokensSaved || 0).toLocaleString();
      }
    } catch (e) {}
  } catch (err) {
    console.warn('Stats error:', err.message);
  }
}

// Providers Hub Controller
async function loadProviders() {
  try {
    const [portalsRes, keysRes] = await Promise.all([
      fetch(`${API_BASE}/api/providers/portals`),
      fetch(`${API_BASE}/api/providers/keys`)
    ]);

    allPortals = await portalsRes.json();
    allKeys = await keysRes.json();

    document.getElementById('badge-providers-count').textContent = allPortals.length;

    // Update filter badge counters
    const activeCount = allPortals.filter(p => p.status === 'active' || p.status === 'ready').length;
    const noauthCount = allPortals.filter(p => p.isNoAuth).length;
    const neededCount = allPortals.filter(p => !p.isNoAuth && p.status !== 'active').length;

    const elAll = document.getElementById('cnt-p-all');
    const elAct = document.getElementById('cnt-p-active');
    const elNoa = document.getElementById('cnt-p-noauth');
    const elNed = document.getElementById('cnt-p-needed');
    if (elAll) elAll.textContent = allPortals.length;
    if (elAct) elAct.textContent = activeCount;
    if (elNoa) elNoa.textContent = noauthCount;
    if (elNed) elNed.textContent = neededCount;

    renderProvidersGrid();
    renderProviderKeysTable(allKeys);
  } catch (err) {
    showToast('Failed to load providers: ' + err.message, 'error');
  }
}

function renderProvidersGrid() {
  const container = document.getElementById('providers-grid');
  if (!container) return;

  const searchQuery = (document.getElementById('input-provider-search')?.value || '').toLowerCase().trim();

  const filtered = allPortals.filter(p => {
    let matchesType = true;
    if (activeProviderFilter === 'active') matchesType = (p.status === 'active' || p.status === 'ready');
    else if (activeProviderFilter === 'noauth') matchesType = !!p.isNoAuth;
    else if (activeProviderFilter === 'needed') matchesType = (!p.isNoAuth && p.status !== 'active');

    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery) ||
      p.id.toLowerCase().includes(searchQuery) ||
      (p.popularModels && p.popularModels.toLowerCase().includes(searchQuery));

    return matchesType && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">
        No providers found matching this filter or search.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const isReady = p.status === 'ready';
    const isActive = p.status === 'active';
    let statusBadge = '<span class="tag-status standby">⚪ Key Needed</span>';
    if (p.isNoAuth) {
      statusBadge = '<span class="tag-status live" style="background:rgba(0,245,212,0.15);color:var(--accent-cyan);border-color:var(--accent-cyan);">⚡ Zero-Key Live</span>';
    } else if (isActive) {
      statusBadge = `<span class="tag-status live">🟢 ${p.activeKeysCount} Key(s) Active</span>`;
    } else if (isReady) {
      statusBadge = '<span class="tag-status live">🟢 Ready</span>';
    }

    const isLocalOrMock = p.id === 'ollama' || p.id === 'lmstudio' || p.id === 'mock';

    return `
      <div class="provider-card ${isActive || isReady || p.isNoAuth ? 'status-active' : ''}">
        <div>
          <div class="provider-card-header">
            <h3 class="provider-name">${escapeHtml(p.name)}</h3>
            <span class="provider-badge-pill">${escapeHtml(p.badge)}</span>
          </div>
          <div class="provider-limits">⚡ ${escapeHtml(p.freeTierInfo)}</div>
          <div class="provider-popular">Models: <code>${escapeHtml(p.popularModels)}</code></div>
        </div>

        <div>
          <div class="provider-keys-summary">
            <span>Status:</span>
            ${statusBadge}
          </div>

          <div class="provider-card-actions">
            ${!isLocalOrMock && !p.isNoAuth ? `
              <button class="btn-primary" style="padding: 0.45rem 0.85rem; font-size: 0.8rem;" onclick="openAddKeyModal('${p.id}', '${p.name}', '${p.guide}')">
                + Add Key
              </button>
            ` : `
              <button class="btn-secondary" style="padding: 0.45rem 0.85rem; font-size: 0.8rem;" onclick="testProviderPing('${p.id}', this)">
                🧪 Ping
              </button>
            `}
            ${p.getKeyUrl && p.getKeyUrl !== '#' ? `
              <a href="${p.getKeyUrl}" target="_blank" rel="noopener noreferrer" class="btn-get-free-key">
                Get Free Key ↗
              </a>
            ` : `<span style="font-size: 0.78rem; color: var(--accent-cyan); font-weight: 600;">No Auth Required</span>`}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.testProviderPing = async function(providerId, btn) {
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ ...';
  }
  try {
    const res = await fetch(`${API_BASE}/api/health-check/provider/${providerId}`, { method: 'POST' });
    const data = await res.json();
    if (data.success && data.result) {
      showToast(`${providerId.toUpperCase()}: ${data.result.status.toUpperCase()} (${data.result.latency_ms || 10}ms)`, 'success');
      loadHealth();
    } else {
      showToast(`${providerId}: ${data.error || 'Check failed'}`, 'error');
    }
  } catch (err) {
    showToast(`Ping failed: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🧪 Ping';
    }
  }
};

function renderProviderKeysTable(keys) {
  const tbody = document.getElementById('tbody-provider-keys');
  if (!tbody) return;

  if (keys.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No external provider keys added yet. System is currently running in Zero-Key Public & Fallback mode with full route simulation.
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
        <td><strong>${escapeHtml(k.provider.toUpperCase())}</strong></td>
        <td>${escapeHtml(k.label || '-')}</td>
        <td><code style="font-family: var(--font-mono); color: var(--accent-cyan);">${escapeHtml(k.api_key_masked)}</code></td>
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

// Free Models Catalog with Advanced Pagination
async function loadModels() {
  try {
    const res = await fetch(`${API_BASE}/api/models`);
    const data = await res.json();
    allModels = data.models || [];
    allCombos = data.combos || [];

    populateProviderDropdown(allModels);
    renderCombos(allCombos);
    renderFilteredModels();
    populatePlaygroundModels(allCombos, allModels);
  } catch (err) {
    showToast('Failed to load models: ' + err.message, 'error');
  }
}

function populateProviderDropdown(models) {
  const select = document.getElementById('select-model-provider');
  if (!select) return;

  const currentVal = select.value;
  const providerCounts = {};
  models.forEach(m => {
    providerCounts[m.provider] = (providerCounts[m.provider] || 0) + 1;
  });

  const sortedProviders = Object.keys(providerCounts).sort();
  select.innerHTML = '<option value="">All Providers (' + sortedProviders.length + ')</option>' +
    sortedProviders.map(p => `
      <option value="${p}">${p.toUpperCase()} (${providerCounts[p]})</option>
    `).join('');

  if (currentVal) select.value = currentVal;
}

function renderCombos(combos) {
  const container = document.getElementById('combos-grid');
  if (!container) return;

  container.innerHTML = combos.map(c => `
    <div class="combo-card">
      <div>
        <span class="combo-badge">100% FREE FAILOVER COMBO</span>
        <h3 class="combo-title">${escapeHtml(c.display_name)}</h3>
        <div class="combo-id">Model ID: <code>${escapeHtml(c.id)}</code></div>
        <p class="combo-desc">${escapeHtml(c.description)}</p>
      </div>

      <div>
        <div class="combo-chain">
          <div class="combo-chain-title">Automatic Failover Route Chain:</div>
          <div class="chain-steps">
            ${c.targets.slice(0, 5).map((t, idx) => `
              <span class="chain-step">${escapeHtml(t.provider)}/${escapeHtml(t.model.split('/').pop())}</span>
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

function renderFilteredModels() {
  const container = document.getElementById('models-grid');
  if (!container) return;

  const search = (document.getElementById('input-model-search')?.value || '').toLowerCase().trim();

  // 1. Filter
  let filtered = allModels.filter(m => {
    const matchesCapability = activeFilter === 'all' || (m.capabilities && m.capabilities.includes(activeFilter));
    const matchesProvider = !selectedProviderDropdown || m.provider === selectedProviderDropdown;
    const matchesSearch = !search ||
      m.display_name.toLowerCase().includes(search) ||
      m.model_id.toLowerCase().includes(search) ||
      m.provider.toLowerCase().includes(search);

    return matchesCapability && matchesProvider && matchesSearch;
  });

  // 2. Sort
  filtered.sort((a, b) => {
    if (selectedSortOrder === 'context-desc') return (b.context_window || 0) - (a.context_window || 0);
    if (selectedSortOrder === 'context-asc') return (a.context_window || 0) - (b.context_window || 0);
    if (selectedSortOrder === 'name-asc') return a.display_name.localeCompare(b.display_name);
    if (selectedSortOrder === 'provider-asc') return a.provider.localeCompare(b.provider);
    return 0;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / modelsPerPage) || 1;
  modelsCurrentPage = Math.max(1, Math.min(modelsCurrentPage, totalPages));

  // 3. Slice page
  const startIdx = (modelsCurrentPage - 1) * modelsPerPage;
  const endIdx = Math.min(startIdx + modelsPerPage, totalFiltered);
  const pageSlice = filtered.slice(startIdx, endIdx);

  // 4. Update Meta and Page Indicators
  const metaEl = document.getElementById('models-results-count');
  if (metaEl) {
    metaEl.textContent = totalFiltered > 0
      ? `Showing ${startIdx + 1}–${endIdx} of ${totalFiltered} free models`
      : '0 models found';
  }

  const indEl = document.getElementById('page-indicator');
  if (indEl) indEl.textContent = `${modelsCurrentPage} / ${totalPages}`;

  updatePaginationButtons(totalPages);

  // 5. Render Cards
  if (pageSlice.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">
        No free models found matching this filter.
      </div>
    `;
    renderModelsMatrix([]);
    return;
  }

  container.innerHTML = pageSlice.map(m => {
    const contextFormatted = m.context_window >= 1000000
      ? `${(m.context_window / 1000000).toFixed(1)}M`
      : `${Math.round((m.context_window || 8192) / 1024)}k`;

    return `
      <div class="model-card">
        <div>
          <div class="model-header">
            <h4 class="model-name">${escapeHtml(m.display_name)}</h4>
            <span class="provider-badge-pill" style="font-size: 0.65rem;">${escapeHtml(m.provider.toUpperCase())}</span>
          </div>
          <div class="model-id-pill">${escapeHtml(m.id)}</div>
          <div class="model-tags">
            <span class="model-tag free-tag">100% FREE</span>
            <span class="model-tag context-tag">${contextFormatted} Context</span>
            ${(m.capabilities || 'chat').split(',').map(c => `<span class="model-tag">${escapeHtml(c.trim())}</span>`).join('')}
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <button class="btn-primary" style="flex: 1; padding: 0.4rem; font-size: 0.78rem;" onclick="useModelInPlayground('${escapeHtml(m.id)}')">
            Playground 💬
          </button>
          <button class="btn-secondary" style="padding: 0.4rem 0.65rem; font-size: 0.78rem;" onclick="copyText('${escapeHtml(m.id)}')">
            Copy
          </button>
        </div>
      </div>
    `;
  }).join('');

  renderModelsMatrix(pageSlice);
}

function updatePaginationButtons(totalPages) {
  const btnPrev = document.getElementById('btn-page-prev');
  const btnNext = document.getElementById('btn-page-next');
  const btnPrevB = document.getElementById('btn-page-prev-b');
  const btnNextB = document.getElementById('btn-page-next-b');

  const isFirst = modelsCurrentPage <= 1;
  const isLast = modelsCurrentPage >= totalPages;

  if (btnPrev) btnPrev.disabled = isFirst;
  if (btnNext) btnNext.disabled = isLast;
  if (btnPrevB) btnPrevB.disabled = isFirst;
  if (btnNextB) btnNextB.disabled = isLast;

  const containerNumbers = document.getElementById('models-page-numbers');
  if (!containerNumbers) return;

  let pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages = [1];
    let start = Math.max(2, modelsCurrentPage - 1);
    let end = Math.min(totalPages - 1, modelsCurrentPage + 1);

    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  containerNumbers.innerHTML = pages.map(p => {
    if (p === '...') return `<span style="color: var(--text-muted); padding: 0 0.2rem;">...</span>`;
    return `
      <button class="page-num-btn ${p === modelsCurrentPage ? 'active' : ''}" onclick="goToModelPage(${p})">
        ${p}
      </button>
    `;
  }).join('');
}

window.goToModelPage = function(pageNum) {
  modelsCurrentPage = pageNum;
  renderFilteredModels();
  document.getElementById('tab-models')?.scrollIntoView({ behavior: 'smooth' });
};

function initFilters() {
  // Capability pills
  const pills = document.querySelectorAll('#model-filter-pills .filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.getAttribute('data-filter');
      modelsCurrentPage = 1;
      renderFilteredModels();
    });
  });

  // Search input
  document.getElementById('input-model-search')?.addEventListener('input', () => {
    modelsCurrentPage = 1;
    renderFilteredModels();
  });

  // Provider dropdown
  const provSelect = document.getElementById('select-model-provider');
  provSelect?.addEventListener('change', () => {
    selectedProviderDropdown = provSelect.value;
    modelsCurrentPage = 1;
    renderFilteredModels();
  });

  // Sort dropdown
  const sortSelect = document.getElementById('select-model-sort');
  sortSelect?.addEventListener('change', () => {
    selectedSortOrder = sortSelect.value;
    renderFilteredModels();
  });

  // Pagination navigation
  const prevHandler = () => {
    if (modelsCurrentPage > 1) {
      modelsCurrentPage--;
      renderFilteredModels();
    }
  };
  const nextHandler = () => {
    modelsCurrentPage++;
    renderFilteredModels();
  };

  document.getElementById('btn-page-prev')?.addEventListener('click', prevHandler);
  document.getElementById('btn-page-next')?.addEventListener('click', nextHandler);
  document.getElementById('btn-page-prev-b')?.addEventListener('click', prevHandler);
  document.getElementById('btn-page-next-b')?.addEventListener('click', nextHandler);

  // Provider Hub filters
  const provPills = document.querySelectorAll('#provider-filter-pills .filter-pill');
  provPills.forEach(pill => {
    pill.addEventListener('click', () => {
      provPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeProviderFilter = pill.getAttribute('data-pfilter');
      renderProvidersGrid();
    });
  });

  document.getElementById('input-provider-search')?.addEventListener('input', () => {
    renderProvidersGrid();
  });

  // Rankings category filters
  const rankPills = document.querySelectorAll('#rankings-filter-pills .filter-pill');
  rankPills.forEach(pill => {
    pill.addEventListener('click', () => {
      rankPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeRankingsFilter = pill.getAttribute('data-rfilter');
      renderRankingsTable();
    });
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

// Client System API Keys
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
      <td><strong>${escapeHtml(k.name)}</strong></td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <code style="font-family: var(--font-mono); color: var(--accent-cyan);">${escapeHtml(k.key)}</code>
          <button class="btn-copy-small" onclick="copyText('${escapeHtml(k.key)}')" title="Copy Key">📋</button>
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

// Universal Agent Handshake Tester
function initHandshakeTester() {
  document.getElementById('btn-test-handshake')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-test-handshake');
    const badge = document.getElementById('handshake-badge');
    const meta = document.getElementById('handshake-meta');

    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Testing...';
    }
    if (badge) {
      badge.className = 'handshake-badge testing';
      badge.textContent = '● Probing Gateway...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/handshake`);
      const data = await res.json();

      if (data.success) {
        if (badge) {
          badge.className = 'handshake-badge live';
          badge.textContent = `🟢 Connected & Ready (${data.latencyMs || 1}ms)`;
        }
        if (meta) {
          meta.innerHTML = `<strong>Handshake OK!</strong> Active Free Models: <code>${data.activeFreeModels}</code> | Client Keys: <code>${data.clientKeysActive}</code> | Endpoint: <code>${data.endpoint}</code>`;
        }
        showToast('Universal Agent HP Handshake Successful!', 'success');
      } else {
        throw new Error(data.error || 'Handshake failed');
      }
    } catch (err) {
      if (badge) {
        badge.className = 'handshake-badge error';
        badge.textContent = '🔴 Connection Error';
      }
      if (meta) meta.textContent = 'Error: ' + err.message;
      showToast('Handshake failed: ' + err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🧪 Test Handshake';
      }
    }
  });
}

// Playground Controller
function initPlayground() {
  const tempSlider = document.getElementById('range-play-temp');
  const tempVal = document.getElementById('val-play-temp');
  if (tempSlider && tempVal) {
    tempSlider.addEventListener('input', () => {
      tempVal.textContent = tempSlider.value;
    });
  }

  const sendBtn = document.getElementById('btn-play-send');
  const stopBtn = document.getElementById('btn-play-stop');
  const clearBtn = document.getElementById('btn-play-clear');
  const copyAllBtn = document.getElementById('btn-play-copy-all');
  const resetSysBtn = document.getElementById('btn-clear-system');
  const presetSelect = document.getElementById('select-system-preset');
  const msgInput = document.getElementById('input-play-message');
  const modelSelect = document.getElementById('select-play-model');

  modelSelect?.addEventListener('change', () => {
    const pill = document.getElementById('play-active-model-pill');
    if (pill) pill.textContent = `⚡ ${modelSelect.value}`;
  });

  presetSelect?.addEventListener('change', () => {
    const sys = document.getElementById('input-play-system');
    if (sys && presetSelect.value) {
      sys.value = presetSelect.value;
      showToast('System preset applied', 'success');
    }
  });

  document.querySelectorAll('#quick-prompts-bar .chip-prompt').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt && msgInput) {
        msgInput.value = prompt;
        msgInput.focus();
        showToast('Prompt inserted. Press Send or Enter!', 'success');
      }
    });
  });

  sendBtn?.addEventListener('click', sendPlaygroundMessage);
  stopBtn?.addEventListener('click', stopPlaygroundGeneration);

  clearBtn?.addEventListener('click', () => {
    currentChatHistory = [];
    const container = document.getElementById('play-chat-messages');
    if (container) {
      container.innerHTML = `
        <div class="chat-bubble assistant">
          <div class="bubble-header">⚡ Extra LLM X System</div>
          <div class="bubble-content">
            Conversation cleared. Ready for your next query!
          </div>
        </div>
      `;
    }
    showToast('Chat history cleared', 'success');
  });

  copyAllBtn?.addEventListener('click', () => {
    if (currentChatHistory.length === 0) {
      showToast('No messages to copy', 'error');
      return;
    }
    const text = currentChatHistory.map(m => `[${m.role.toUpperCase()}]:\n${m.content}`).join('\n\n---\n\n');
    copyText(text, copyAllBtn);
  });

  resetSysBtn?.addEventListener('click', () => {
    const sys = document.getElementById('input-play-system');
    if (sys) sys.value = '';
    if (presetSelect) presetSelect.value = '';
    showToast('System prompt reset', 'success');
  });

  // Purge Cache button
  document.getElementById('btn-purge-cache')?.addEventListener('click', async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cache/clear`, { method: 'POST' });
      if (res.ok) {
        showToast('Response cache purged successfully!', 'success');
        loadStats();
      }
    } catch (err) {
      showToast('Failed to purge cache: ' + err.message, 'error');
    }
  });

  // Playground Sub-Mode Switching (Chat / Arena / Images / Embeddings)
  const modeBtns = document.querySelectorAll('#playground-mode-tabs .mode-tab-btn');
  const modePanels = document.querySelectorAll('.playground-mode-panel');

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-pmode');
      modeBtns.forEach(b => b.classList.remove('active'));
      modePanels.forEach(p => p.classList.add('hidden'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(`panel-pmode-${mode}`);
      if (targetPanel) {
        targetPanel.classList.remove('hidden');
        targetPanel.classList.add('active');
      }
    });
  });

  initArena();
  initImageStudio();
  initEmbeddingsStudio();
}

function populatePlaygroundModels(combos, models) {
  const optCombos = document.getElementById('optgroup-combos');
  const optModels = document.getElementById('optgroup-models');
  const arenaSelectA = document.getElementById('select-arena-model-a');
  const arenaSelectB = document.getElementById('select-arena-model-b');

  if (optCombos && optModels) {
    optCombos.innerHTML = combos.map(c => `
      <option value="${c.id}">${c.display_name} (${c.id})</option>
    `).join('');

    optModels.innerHTML = models.map(m => `
      <option value="${m.id}">${m.display_name}</option>
    `).join('');
  }

  // Populate Arena Selectors
  if (arenaSelectA && arenaSelectB) {
    const allOptionsHtml = [
      ...combos.map(c => `<option value="${c.id}">${c.display_name}</option>`),
      ...models.slice(0, 50).map(m => `<option value="${m.id}">${m.display_name} [${m.provider}]</option>`)
    ].join('');

    arenaSelectA.innerHTML = allOptionsHtml;
    arenaSelectB.innerHTML = allOptionsHtml;

    if (combos.length >= 2) {
      arenaSelectA.value = combos[0].id;
      arenaSelectB.value = combos[1].id;
    }
  }
}

// ⚔️ Model Arena (Battle Side-by-Side) Controller
let arenaAbortController = null;
let isArenaBattling = false;

function initArena() {
  const selectA = document.getElementById('select-arena-model-a');
  const selectB = document.getElementById('select-arena-model-b');
  const titleA = document.getElementById('arena-title-a');
  const titleB = document.getElementById('arena-title-b');

  selectA?.addEventListener('change', () => {
    if (titleA) titleA.textContent = selectA.value;
  });
  selectB?.addEventListener('change', () => {
    if (titleB) titleB.textContent = selectB.value;
  });

  document.getElementById('btn-arena-send')?.addEventListener('click', startArenaBattle);
  document.getElementById('btn-arena-stop')?.addEventListener('click', () => {
    if (arenaAbortController) {
      arenaAbortController.abort();
      arenaAbortController = null;
      showToast('Arena battle stopped', 'info');
    }
  });

  document.getElementById('input-arena-prompt')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      startArenaBattle();
    }
  });
}

async function startArenaBattle() {
  if (isArenaBattling) return;
  const promptInput = document.getElementById('input-arena-prompt');
  const prompt = (promptInput?.value || '').trim();
  if (!prompt) return;

  const modelA = document.getElementById('select-arena-model-a')?.value || 'extra/auto-free';
  const modelB = document.getElementById('select-arena-model-b')?.value || 'extra/free-fast';

  const bodyA = document.getElementById('arena-body-a');
  const bodyB = document.getElementById('arena-body-b');
  const statsA = document.getElementById('arena-stats-a');
  const statsB = document.getElementById('arena-stats-b');
  const sendBtn = document.getElementById('btn-arena-send');
  const stopBtn = document.getElementById('btn-arena-stop');

  if (statsA) { statsA.className = 'arena-stats-pill'; statsA.textContent = 'Streaming...'; }
  if (statsB) { statsB.className = 'arena-stats-pill'; statsB.textContent = 'Streaming...'; }

  if (bodyA) bodyA.innerHTML = '<div class="chat-bubble assistant"><div class="bubble-content"><span class="streaming-cursor"></span></div></div>';
  if (bodyB) bodyB.innerHTML = '<div class="chat-bubble assistant"><div class="bubble-content"><span class="streaming-cursor"></span></div></div>';

  isArenaBattling = true;
  arenaAbortController = new AbortController();

  if (sendBtn) sendBtn.classList.add('hidden');
  if (stopBtn) stopBtn.classList.remove('hidden');

  let timeA = 0;
  let timeB = 0;
  let tokA = 0;
  let tokB = 0;
  let doneA = false;
  let doneB = false;

  const runStream = async (model, bodyEl, statsEl, onDone) => {
    const start = Date.now();
    let text = '';
    const contentEl = bodyEl.querySelector('.bubble-content');

    try {
      const res = await fetch(`${API_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer elx-live-universal-agent-free-hub'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
          temperature: 0.7
        }),
        signal: arenaAbortController.signal
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const delta = parsed.choices?.[0]?.delta?.content || '';
              text += delta;
              if (contentEl) contentEl.innerHTML = formatMarkdown(text) + '<span class="streaming-cursor"></span>';
              bodyEl.scrollTop = bodyEl.scrollHeight;
            } catch (e) {}
          }
        }
      }

      if (contentEl) contentEl.innerHTML = formatMarkdown(text);
      const latency = Date.now() - start;
      const tokEst = Math.max(1, Math.round(text.length / 4));
      const tokPerSec = Math.round((tokEst / (latency / 1000)));
      statsEl.textContent = `${latency}ms • ${tokPerSec} tok/s`;
      onDone(latency, tokPerSec);
    } catch (err) {
      if (err.name === 'AbortError') {
        if (contentEl) contentEl.innerHTML += '<div style="color:var(--accent-amber);font-size:0.75rem;">[Cancelled]</div>';
        statsEl.textContent = 'Cancelled';
      } else {
        if (contentEl) contentEl.innerHTML = `<span style="color:#ef4444;">Error: ${escapeHtml(err.message)}</span>`;
        statsEl.textContent = 'Error';
      }
      onDone(999999, 0);
    }
  };

  const evaluateBattle = () => {
    if (doneA && doneB) {
      isArenaBattling = false;
      arenaAbortController = null;
      if (sendBtn) sendBtn.classList.remove('hidden');
      if (stopBtn) stopBtn.classList.add('hidden');

      if (timeA < timeB && timeA < 900000) {
        statsA.classList.add('winner');
        statsA.innerHTML = `👑 FASTEST (${timeA}ms • ${tokA} tok/s)`;
      } else if (timeB < timeA && timeB < 900000) {
        statsB.classList.add('winner');
        statsB.innerHTML = `👑 FASTEST (${timeB}ms • ${tokB} tok/s)`;
      }
    }
  };

  runStream(modelA, bodyA, statsA, (t, tok) => {
    timeA = t;
    tokA = tok;
    doneA = true;
    evaluateBattle();
  });

  runStream(modelB, bodyB, statsB, (t, tok) => {
    timeB = t;
    tokB = tok;
    doneB = true;
    evaluateBattle();
  });
}

// 🎨 Flux Image Studio Controller
function initImageStudio() {
  const genBtn = document.getElementById('btn-generate-image');
  const promptInput = document.getElementById('input-image-prompt');
  const modelSelect = document.getElementById('select-image-model');
  const sizeSelect = document.getElementById('select-image-size');
  const placeholder = document.getElementById('image-placeholder');
  const resultBox = document.getElementById('image-result-box');
  const displayImg = document.getElementById('img-result-display');
  const copyUrlBtn = document.getElementById('btn-copy-image-url');
  const downloadLink = document.getElementById('btn-download-image');

  let lastGeneratedUrl = '';

  genBtn?.addEventListener('click', async () => {
    const prompt = (promptInput?.value || '').trim();
    if (!prompt) {
      showToast('Please enter an image prompt', 'error');
      return;
    }

    genBtn.disabled = true;
    genBtn.innerHTML = '🎨 Generating via Pollinations Flux...';
    placeholder?.classList.remove('hidden');
    resultBox?.classList.add('hidden');

    try {
      const res = await fetch(`${API_BASE}/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer elx-live-universal-agent-free-hub'
        },
        body: JSON.stringify({
          prompt,
          model: modelSelect?.value || 'flux',
          size: sizeSelect?.value || '1024x1024',
          n: 1
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) throw new Error('No image URL returned');

      lastGeneratedUrl = imageUrl;
      displayImg.src = imageUrl;

      displayImg.onload = () => {
        placeholder?.classList.add('hidden');
        resultBox?.classList.remove('hidden');
        showToast('Free image generated successfully!', 'success');
      };

      if (downloadLink) {
        downloadLink.href = imageUrl;
      }
    } catch (err) {
      showToast('Image generation failed: ' + err.message, 'error');
    } finally {
      genBtn.disabled = false;
      genBtn.innerHTML = '<span>🎨 Generate Free Image ($0)</span>';
    }
  });

  copyUrlBtn?.addEventListener('click', () => {
    if (lastGeneratedUrl) {
      copyText(lastGeneratedUrl, copyUrlBtn);
    }
  });
}

// 🧬 Embeddings Studio Controller
function initEmbeddingsStudio() {
  const computeBtn = document.getElementById('btn-compute-embeddings');
  const text1El = document.getElementById('input-emb-text1');
  const text2El = document.getElementById('input-emb-text2');
  const panel = document.getElementById('emb-result-panel');
  const scoreEl = document.getElementById('emb-similarity-score');
  const barEl = document.getElementById('emb-similarity-bar');
  const previewEl = document.getElementById('emb-vector-preview');

  computeBtn?.addEventListener('click', async () => {
    const text1 = (text1El?.value || '').trim();
    const text2 = (text2El?.value || '').trim();
    if (!text1 || !text2) {
      showToast('Please provide both text samples', 'error');
      return;
    }

    computeBtn.disabled = true;
    computeBtn.innerHTML = '🧬 Computing 1536-dim embeddings...';

    try {
      const res = await fetch(`${API_BASE}/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer elx-live-universal-agent-free-hub'
        },
        body: JSON.stringify({
          input: [text1, text2],
          model: 'extra/free-embedding'
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const vecA = data.data?.[0]?.embedding;
      const vecB = data.data?.[1]?.embedding;

      if (!vecA || !vecB) throw new Error('Invalid embeddings format');

      // Calculate Cosine Similarity
      let dot = 0, normA = 0, normB = 0;
      for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }
      const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
      const simPercent = Math.max(0, Math.min(100, Math.round(similarity * 100)));

      panel?.classList.remove('hidden');
      if (scoreEl) scoreEl.textContent = similarity.toFixed(3);
      if (barEl) barEl.style.width = `${simPercent}%`;

      if (previewEl) {
        previewEl.textContent = `[${vecA.slice(0, 10).map(v => v.toFixed(5)).join(', ')}, ... +${vecA.length - 10} dimensions]`;
      }

      showToast(`Computed Cosine Similarity: ${similarity.toFixed(3)}`, 'success');
    } catch (err) {
      showToast('Embedding calculation failed: ' + err.message, 'error');
    } finally {
      computeBtn.disabled = false;
      computeBtn.innerHTML = '<span>🧬 Calculate Embeddings & Cosine Similarity</span>';
    }
  });
}

function stopPlaygroundGeneration() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
    showToast('Generation cancelled', 'success');
  }
}

async function sendPlaygroundMessage() {
  if (isGenerating) return;
  const input = document.getElementById('input-play-message');
  const text = (input?.value || '').trim();
  if (!text) return;

  const chatMessages = document.getElementById('play-chat-messages');
  const model = document.getElementById('select-play-model').value || 'extra/auto-free';
  const temperature = parseFloat(document.getElementById('range-play-temp').value || '0.7');
  const maxTokens = parseInt(document.getElementById('input-play-tokens').value || '1024', 10);
  const systemPrompt = (document.getElementById('input-play-system')?.value || '').trim();

  // Construct message payload
  const messagesToSend = [];
  if (systemPrompt) {
    messagesToSend.push({ role: 'system', content: systemPrompt });
  }
  currentChatHistory.forEach(m => messagesToSend.push(m));
  messagesToSend.push({ role: 'user', content: text });

  appendChatBubble('user', 'You', text);
  input.value = '';
  isGenerating = true;

  const sendBtn = document.getElementById('btn-play-send');
  const stopBtn = document.getElementById('btn-play-stop');
  const statusPill = document.getElementById('play-stream-status');

  if (sendBtn) sendBtn.classList.add('hidden');
  if (stopBtn) stopBtn.classList.remove('hidden');
  if (statusPill) statusPill.textContent = 'Streaming...';

  const assistantBubble = appendChatBubble('assistant', `⚡ Extra LLM X (${model})`, '');
  const contentEl = assistantBubble.querySelector('.bubble-content');
  contentEl.innerHTML = '<span class="streaming-cursor"></span>';

  currentChatHistory.push({ role: 'user', content: text });
  currentAbortController = new AbortController();

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
        messages: messagesToSend,
        stream: true,
        temperature,
        max_tokens: maxTokens
      }),
      signal: currentAbortController.signal
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `HTTP ${res.status}`);
    }

    const prov = res.headers.get('x-omniroute-provider') || res.headers.get('X-ExtraLLMX-Provider') || 'auto';
    const actualModel = res.headers.get('x-omniroute-actual-model') || res.headers.get('X-ExtraLLMX-Actual-Model') || model;
    const fallback = res.headers.get('x-omniroute-fallback') === 'true' || res.headers.get('X-ExtraLLMX-Fallback') === 'true';

    document.getElementById('tele-provider').textContent = prov.toUpperCase();
    document.getElementById('tele-model').textContent = actualModel;
    document.getElementById('tele-fallback').textContent = fallback ? 'YES (Auto-Failover)' : 'Direct Route';

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
            contentEl.innerHTML = formatMarkdown(fullReply) + '<span class="streaming-cursor"></span>';
            chatMessages.scrollTop = chatMessages.scrollHeight;
          } catch (e) {}
        }
      }
    }

    // Finalize message
    contentEl.innerHTML = formatMarkdown(fullReply);
    currentChatHistory.push({ role: 'assistant', content: fullReply });
    document.getElementById('tele-latency').textContent = `${Date.now() - startTime} ms`;
    if (statusPill) statusPill.textContent = `Completed in ${Date.now() - startTime}ms`;
  } catch (err) {
    if (err.name === 'AbortError') {
      contentEl.innerHTML += '<div style="color: var(--accent-amber); font-size: 0.8rem; margin-top: 0.5rem;">[Generation Stopped]</div>';
    } else {
      contentEl.innerHTML = `<span style="color: #ef4444;">❌ Error: ${escapeHtml(err.message)}</span>`;
    }
    if (statusPill) statusPill.textContent = 'Stopped';
  } finally {
    isGenerating = false;
    currentAbortController = null;
    if (sendBtn) sendBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
  }
}

function appendChatBubble(role, sender, text) {
  const container = document.getElementById('play-chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerHTML = `
    <div class="bubble-header flex-between">
      <span>${escapeHtml(sender)}</span>
      <button class="btn-copy-small" onclick="copyBubbleText(this)" title="Copy Message">📋</button>
    </div>
    <div class="bubble-content">${text ? formatMarkdown(text) : ''}</div>
  `;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

window.copyBubbleText = function(btn) {
  const contentEl = btn.closest('.chat-bubble')?.querySelector('.bubble-content');
  if (contentEl) {
    copyText(contentEl.innerText || contentEl.textContent);
  }
};

// Markdown Formatter with Code Block Copy
function formatMarkdown(text) {
  if (!text) return '';

  let html = escapeHtml(text);

  // Code blocks: ```lang\ncode\n```
  html = html.replace(/```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'code';
    return `
      <div class="code-block-wrapper">
        <div class="code-header flex-between">
          <span class="code-lang">${language}</span>
          <button class="btn-copy-code" onclick="copyCodeSnippet(this)">Copy Code</button>
        </div>
        <pre><code class="language-${language}">${code.trim()}</code></pre>
      </div>
    `;
  });

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Newlines to <br>
  html = html.replace(/\n/g, '<br>');

  return html;
}

window.copyCodeSnippet = function(btn) {
  const codeEl = btn.closest('.code-block-wrapper')?.querySelector('code');
  if (codeEl) {
    copyText(codeEl.innerText || codeEl.textContent);
  }
};

// Rankings Controller
async function loadRankings() {
  try {
    const [rankRes, sumRes] = await Promise.all([
      fetch(`${API_BASE}/api/free-provider-rankings`),
      fetch(`${API_BASE}/api/free-tier/summary`)
    ]);

    if (sumRes.ok) {
      const summary = await sumRes.json();
      const elTotal = document.getElementById('summary-total-free-models');
      const elActive = document.getElementById('summary-active-free-models');
      const elZero = document.getElementById('summary-zero-key-providers');
      const elCap = document.getElementById('summary-monthly-capacity');

      if (elTotal) elTotal.textContent = summary.totalCuratedFreeModels ? `${summary.totalCuratedFreeModels}+` : '523+';
      if (elActive) elActive.textContent = summary.activeFreeModels ? `${summary.activeFreeModels}+` : '600+';
      if (elZero) elZero.textContent = summary.zeroKeyProviders ?? '5';
      if (elCap) elCap.textContent = summary.monthlyCapacityPool || '1.5B+';
    }

    if (rankRes.ok) {
      const data = await rankRes.json();
      allRankings = data.rankings || [];
      renderRankingsTable();
    }
  } catch (err) {
    console.warn('Rankings load error:', err.message);
  }
}

function renderRankingsTable() {
  const tbody = document.getElementById('tbody-rankings');
  if (!tbody) return;

  const filtered = allRankings.filter(r => {
    if (activeRankingsFilter === 'all') return true;
    return r.category && r.category.toLowerCase().includes(activeRankingsFilter.toLowerCase());
  });

  tbody.innerHTML = filtered.map(r => {
    const rankMedal = r.rank === 1 ? '🥇 #1' : r.rank === 2 ? '🥈 #2' : r.rank === 3 ? '🥉 #3' : `#${r.rank}`;
    const statusBadge = r.isConfigured
      ? `<span class="tag-status live">● Active</span>`
      : r.isNoAuth
        ? `<span class="tag-status live" style="background:rgba(0,245,212,0.15);color:var(--accent-cyan);border-color:var(--accent-cyan);">⚡ Zero-Key Live</span>`
        : `<span class="tag-status standby">○ Key Needed</span>`;

    const topModels = (r.topFreeModels || []).map(m => `<span class="model-tag">${escapeHtml(m)}</span>`).join(' ');

    return `
      <tr>
        <td><strong style="color: var(--accent-cyan);">${rankMedal}</strong></td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(r.name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(r.category || 'General LLM')}</div>
        </td>
        <td><span class="elo-badge">${r.benchmarkScore}</span></td>
        <td><span class="tok-speed">${r.speedTokPerSec} tok/s</span></td>
        <td><span style="font-size: 0.82rem; color: var(--text-secondary);">${escapeHtml(r.freeQuota)}</span></td>
        <td><div style="display:flex; flex-wrap:wrap; gap:4px;">${topModels}</div></td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');
}

// Telemetry Logs Controller
async function loadLogs() {
  try {
    const res = await fetch(`${API_BASE}/api/logs?limit=100`);
    if (!res.ok) return;
    allLogs = await res.json();
    renderLogsTable();
  } catch (err) {
    console.warn('Logs error:', err.message);
  }
}

function renderLogsTable() {
  const tbody = document.getElementById('tbody-logs');
  if (!tbody) return;

  const search = (document.getElementById('input-log-search')?.value || '').toLowerCase().trim();

  const filtered = allLogs.filter(l => {
    if (!search) return true;
    return (l.requested_model && l.requested_model.toLowerCase().includes(search)) ||
      (l.provider && l.provider.toLowerCase().includes(search)) ||
      (l.actual_model && l.actual_model.toLowerCase().includes(search)) ||
      String(l.status_code).includes(search);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No telemetry requests recorded. Send queries from Universal Agent HP or the Playground!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(l => {
    const time = new Date(l.timestamp).toLocaleTimeString();
    const isSuccess = l.status_code === 200;

    return `
      <tr>
        <td>${time}</td>
        <td><code>${escapeHtml(l.requested_model)}</code></td>
        <td><strong>${escapeHtml((l.provider || '-').toUpperCase())}</strong></td>
        <td><code>${escapeHtml(l.actual_model || '-')}</code></td>
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
        <td>
          <button class="btn-secondary btn-sm" onclick="inspectTelemetryLog('${escapeHtml(l.id)}')">
            🔍 Inspect
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.inspectTelemetryLog = function(logId) {
  const log = allLogs.find(l => l.id === logId);
  if (!log) return;

  const metaEl = document.getElementById('log-detail-meta');
  const jsonEl = document.getElementById('modal-log-json');
  const modal = document.getElementById('modal-log-detail');

  if (metaEl) {
    metaEl.innerHTML = `
      <div class="log-meta-card">
        <div class="log-meta-label">Status Code</div>
        <div class="log-meta-val" style="color: ${log.status_code === 200 ? 'var(--accent-green)' : '#ef4444'};">${log.status_code}</div>
      </div>
      <div class="log-meta-card">
        <div class="log-meta-label">Latency</div>
        <div class="log-meta-val">${log.latency_ms} ms</div>
      </div>
      <div class="log-meta-card">
        <div class="log-meta-label">Provider</div>
        <div class="log-meta-val">${escapeHtml((log.provider || 'none').toUpperCase())}</div>
      </div>
      <div class="log-meta-card">
        <div class="log-meta-label">Total Tokens</div>
        <div class="log-meta-val">${(log.prompt_tokens || 0) + (log.completion_tokens || 0)}</div>
      </div>
    `;
  }

  if (jsonEl) {
    jsonEl.textContent = JSON.stringify(log, null, 2);
  }

  modal?.classList.add('active');
};

function initTelemetryActions() {
  document.getElementById('input-log-search')?.addEventListener('input', renderLogsTable);

  document.getElementById('btn-export-logs')?.addEventListener('click', () => {
    window.location.href = `${API_BASE}/api/logs/export`;
    showToast('Telemetry logs exported as JSON', 'success');
  });

  document.getElementById('btn-clear-logs')?.addEventListener('click', async () => {
    if (!confirm('Clear all telemetry logs?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/logs/clear`, { method: 'POST' });
      if (res.ok) {
        showToast('Telemetry logs cleared', 'success');
        loadLogs();
        loadStats();
      }
    } catch (err) {
      showToast('Failed to clear logs: ' + err.message, 'error');
    }
  });

  document.getElementById('btn-close-log-modal')?.addEventListener('click', () => {
    document.getElementById('modal-log-detail')?.classList.remove('active');
  });
  document.getElementById('btn-close-log-modal-ft')?.addEventListener('click', () => {
    document.getElementById('modal-log-detail')?.classList.remove('active');
  });
}

// Modals Controller
function initModals() {
  const modalAddKey = document.getElementById('modal-add-key');
  document.getElementById('btn-close-key-modal')?.addEventListener('click', () => modalAddKey.classList.remove('active'));
  document.getElementById('btn-modal-save-key')?.addEventListener('click', saveModalProviderKey);
  document.getElementById('btn-modal-test-key')?.addEventListener('click', testModalProviderKey);

  // Toggle Password Masking
  document.getElementById('btn-toggle-modal-pwd')?.addEventListener('click', () => {
    const input = document.getElementById('modal-input-key');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  });

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
    showToast('API Key cannot be empty', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/providers/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, label })
    });

    if (res.ok) {
      showToast(`Key saved for ${provider.toUpperCase()}!`, 'success');
      document.getElementById('modal-add-key').classList.remove('active');
      loadProviders();
      loadModels();
    } else {
      const err = await res.json();
      showToast('Error: ' + err.error, 'error');
    }
  } catch (err) {
    showToast('Failed to save key: ' + err.message, 'error');
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
  const wireCopy = (btnId, textGetter) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      const text = typeof textGetter === 'function' ? textGetter() : textGetter;
      copyText(text, e.currentTarget);
    });
  };

  wireCopy('btn-copy-base-url', () => 'http://localhost:3000/v1');
  wireCopy('btn-copy-quick-env', () => document.getElementById('snippet-quick-env')?.textContent);
  wireCopy('btn-copy-guide-env', () => document.getElementById('guide-code-env')?.textContent);
  wireCopy('btn-copy-guide-cli', () => document.getElementById('guide-code-cli')?.textContent);
  wireCopy('btn-copy-guide-python', () => document.getElementById('guide-code-python')?.textContent);
  wireCopy('btn-copy-guide-cursor', () => document.getElementById('guide-code-cursor')?.textContent);

  document.getElementById('btn-download-env')?.addEventListener('click', (e) => {
    const envContent = document.getElementById('guide-code-env')?.textContent || '';
    const blob = new Blob([envContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Universal-Agent-HP.env';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded Universal-Agent-HP.env file', 'success');
  });
}

window.copyText = function(text, btnElement) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success');
    if (btnElement && btnElement.tagName) {
      const originalHtml = btnElement.innerHTML;
      btnElement.classList.add('btn-copied');
      btnElement.innerHTML = '✓ Copied!';
      setTimeout(() => {
        btnElement.classList.remove('btn-copied');
        btnElement.innerHTML = originalHtml;
      }, 1500);
    }
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
};

function showToast(message, type = 'success') {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = '⚡';
  if (type === 'error') icon = '❌';
  else if (type === 'warning') icon = '⚠️';
  else if (type === 'info') icon = 'ℹ️';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
  `;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
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

// Keyboard Shortcuts
function initKeyboardShortcuts() {
  const modalShortcuts = document.getElementById('modal-shortcuts');
  const openShortcutsBtn = document.getElementById('btn-open-shortcuts');
  const closeShortcutsBtn = document.getElementById('btn-close-shortcuts-modal');
  const closeShortcutsFt = document.getElementById('btn-close-shortcuts-ft');

  const toggleShortcutsModal = () => {
    if (modalShortcuts) modalShortcuts.classList.toggle('active');
  };

  openShortcutsBtn?.addEventListener('click', toggleShortcutsModal);
  closeShortcutsBtn?.addEventListener('click', () => modalShortcuts?.classList.remove('active'));
  closeShortcutsFt?.addEventListener('click', () => modalShortcuts?.classList.remove('active'));

  document.addEventListener('keydown', (e) => {
    const isTyping = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

    // '?' opens shortcuts modal when not in input
    if (e.key === '?' && !isTyping) {
      e.preventDefault();
      toggleShortcutsModal();
      return;
    }

    // Number keys 1-8 switch tabs when not typing
    if (!isTyping && e.key >= '1' && e.key <= '8') {
      const tabs = [
        'tab-cockpit',
        'tab-providers',
        'tab-models',
        'tab-keys',
        'tab-universal',
        'tab-playground',
        'tab-rankings',
        'tab-logs'
      ];
      const targetTab = tabs[parseInt(e.key, 10) - 1];
      if (targetTab) {
        e.preventDefault();
        switchTab(targetTab);
        return;
      }
    }

    // Focus search on '/' when not typing in input
    if (e.key === '/' && !isTyping) {
      e.preventDefault();
      switchTab('tab-models');
      const search = document.getElementById('input-model-search');
      search?.focus();
      search?.select();
      return;
    }

    // Ctrl+Enter sends prompt in playground
    if (e.key === 'Enter' && e.ctrlKey) {
      const activeTab = document.querySelector('.tab-pane.active');
      if (activeTab && activeTab.id === 'tab-playground') {
        e.preventDefault();
        sendPlaygroundMessage();
        return;
      }
    }

    // Escape closes any modal
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
}

// Theme Manager
function initTheme() {
  const currentTheme = localStorage.getItem('elx_theme') || 'neon';
  applyTheme(currentTheme);

  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    const cur = localStorage.getItem('elx_theme') || 'neon';
    let next = 'midnight';
    if (cur === 'midnight') next = 'light';
    else if (cur === 'light') next = 'neon';
    applyTheme(next);
  });
}

function applyTheme(theme) {
  document.body.classList.remove('theme-midnight', 'theme-light');
  const btn = document.getElementById('btn-theme-toggle');

  if (theme === 'midnight') {
    document.body.classList.add('theme-midnight');
    if (btn) btn.innerHTML = '🌙 Midnight';
  } else if (theme === 'light') {
    document.body.classList.add('theme-light');
    if (btn) btn.innerHTML = '☀️ Light';
  } else {
    if (btn) btn.innerHTML = '⚡ Neon';
  }
  localStorage.setItem('elx_theme', theme);
}

// Analytics & Charts
async function loadCharts() {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/charts`);
    if (!res.ok) return;
    const { timeSeries, distribution } = await res.json();

    renderTimeSeriesChart(timeSeries);
    renderDistributionBars(distribution);
  } catch (err) {
    console.warn('Charts load error:', err.message);
  }
}

function renderTimeSeriesChart(data) {
  const container = document.getElementById('chart-requests-canvas');
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div style="width: 100%; text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 2rem 0;">
        Awaiting live requests... Telemetry activates on prompt execution.
      </div>
    `;
    return;
  }

  const maxReq = Math.max(...data.map(d => d.request_count || 1), 1);
  let totalReqs = 0;

  const barsHtml = data.map(d => {
    totalReqs += d.request_count || 0;
    const heightPercent = Math.max(12, Math.round(((d.request_count || 0) / maxReq) * 100));
    return `
      <div class="chart-bar-group" title="${d.time_label}: ${d.request_count} reqs, ${d.token_count || 0} tokens">
        <span class="chart-bar-val">${d.request_count || 0}</span>
        <div class="chart-bar-column" style="height: ${heightPercent}%;"></div>
        <span class="chart-bar-label">${d.time_label || ''}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = barsHtml;
  const tag = document.getElementById('chart-hourly-total');
  if (tag) tag.textContent = `${totalReqs} reqs recorded`;
}

function renderDistributionBars(dist) {
  const container = document.getElementById('chart-provider-bars');
  if (!container) return;

  if (!dist || dist.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 2rem 0;">
        No requests dispatched yet. Try sending a prompt in the Playground!
      </div>
    `;
    return;
  }

  const maxCount = Math.max(...dist.map(d => d.count || 1), 1);
  const rowsHtml = dist.map(d => {
    const pct = Math.round(((d.count || 0) / maxCount) * 100);
    return `
      <div class="provider-bar-row">
        <div class="provider-bar-meta">
          <span class="provider-bar-name">${escapeHtml(d.provider)}</span>
          <span class="provider-bar-count">${d.count} calls</span>
        </div>
        <div class="provider-bar-track">
          <div class="provider-bar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = rowsHtml;
  const tag = document.getElementById('chart-providers-count');
  if (tag) tag.textContent = `${dist.length} active providers`;
}

// Health Monitor
function initHealthCheck() {
  document.getElementById('btn-run-health-check')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-run-health-check');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Probing endpoints...';
    }
    showToast('Probing connected AI providers...', 'success');
    try {
      await fetch(`${API_BASE}/api/health-check/run`, { method: 'POST' });
      showToast('Health diagnostics completed!', 'success');
      loadHealth();
    } catch (err) {
      showToast('Diagnostics failed: ' + err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">⚡</span> Run Full Diagnostics';
      }
    }
  });
}

async function loadHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health-check/status`);
    if (!res.ok) return;
    const records = await res.json();
    renderHealthGrid(records);
  } catch (err) {
    console.warn('Health load error:', err.message);
  }
}

function renderHealthGrid(records) {
  const container = document.getElementById('health-monitor-grid');
  if (!container) return;

  if (!records || records.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">Click 'Run Full Diagnostics' to probe connected providers.</div>`;
    return;
  }

  container.innerHTML = records.map(r => {
    let statusClass = 'offline';
    let statusLabel = 'Offline';

    if (r.status === 'healthy') {
      statusClass = 'healthy';
      statusLabel = `${r.latency_ms || 10}ms`;
    } else if (r.status === 'degraded') {
      statusClass = 'degraded';
      statusLabel = 'Cooldown';
    } else if (r.status === 'unconfigured') {
      statusClass = 'unconfigured';
      statusLabel = 'No Key';
    }

    return `
      <div class="health-card">
        <div class="health-card-left">
          <span class="health-status-dot ${statusClass}"></span>
          <span class="health-name">${escapeHtml(r.provider)}</span>
        </div>
        <span class="health-latency">${statusLabel}</span>
      </div>
    `;
  }).join('');
}

// Matrix View for Models
function initMatrixView() {
  const btnCards = document.getElementById('btn-view-cards');
  const btnMatrix = document.getElementById('btn-view-matrix');
  const cardsWrapper = document.getElementById('models-grid');
  const matrixWrapper = document.getElementById('models-matrix-wrapper');

  btnCards?.addEventListener('click', () => {
    btnCards.classList.add('active');
    btnMatrix?.classList.remove('active');
    cardsWrapper.style.display = 'grid';
    matrixWrapper.style.display = 'none';
  });

  btnMatrix?.addEventListener('click', () => {
    btnMatrix.classList.add('active');
    btnCards?.classList.remove('active');
    cardsWrapper.style.display = 'none';
    matrixWrapper.style.display = 'block';
  });
}

function renderModelsMatrix(modelsToRender) {
  const tbody = document.getElementById('tbody-models-matrix');
  if (!tbody) return;

  const list = modelsToRender || allModels;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No models match this filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(m => {
    const contextFormatted = m.context_window >= 1000000
      ? `${(m.context_window / 1000000).toFixed(1)}M tokens`
      : `${Math.round((m.context_window || 8192) / 1024)}k tokens`;

    const capsBadges = (m.capabilities || 'chat').split(',').map(c => 
      `<span class="model-tag">${escapeHtml(c.trim())}</span>`
    ).join(' ');

    return `
      <tr>
        <td style="font-weight: 600; color: var(--text-primary);">${escapeHtml(m.display_name)}</td>
        <td style="text-transform: capitalize;"><span class="provider-badge-pill">${escapeHtml(m.provider)}</span></td>
        <td><code style="font-family: var(--font-mono); color: var(--accent-cyan);">${contextFormatted}</code></td>
        <td>${capsBadges}</td>
        <td><span class="model-tag free-tag">100% FREE</span></td>
        <td>
          <button class="btn-copy-code" onclick="copyText('${escapeHtml(m.id)}')" title="Copy model ID">Copy ID</button>
        </td>
      </tr>
    `;
  }).join('');
}
