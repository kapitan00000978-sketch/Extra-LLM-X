// Extra LLM X вЂ” Next-Gen Frontend Controller & Telemetry Engine (OmniRoute Parity)

const API_BASE = window.location.origin;

// State Management
let allModels = [];
let allCombos = [];
let allPortals = [];
let allKeys = [];
let allRankings = [];
let allLogs = [];
let allWebhooks = [];

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
  initRoiCalculator();

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
      if (targetId === 'tab-webhooks') loadWebhooks();
    });
  });

  document.getElementById('btn-refresh-rankings')?.addEventListener('click', loadRankings);
  document.getElementById('btn-hero-add-provider')?.addEventListener('click', () => switchTab('tab-providers'));
  document.getElementById('btn-hero-gen-key')?.addEventListener('click', () => {
    switchTab('tab-keys');
    openSysKeyModal();
  });
  document.getElementById('btn-hero-open-gateway')?.addEventListener('click', () => switchTab('tab-gateway'));
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
    let statusBadge = '<span class="tag-status standby">вљЄ Key Needed</span>';
    if (p.isNoAuth) {
      statusBadge = '<span class="tag-status live" style="background:rgba(0,245,212,0.15);color:var(--accent-cyan);border-color:var(--accent-cyan);">вљЎ Zero-Key Live</span>';
    } else if (isActive) {
      statusBadge = `<span class="tag-status live">рџџў ${p.activeKeysCount} Key(s) Active</span>`;
    } else if (isReady) {
      statusBadge = '<span class="tag-status live">рџџў Ready</span>';
    }

    const isLocalOrMock = p.id === 'ollama' || p.id === 'lmstudio' || p.id === 'mock';

    return `
      <div class="provider-card ${isActive || isReady || p.isNoAuth ? 'status-active' : ''}">
        <div>
          <div class="provider-card-header">
            <h3 class="provider-name">${escapeHtml(p.name)}</h3>
            <span class="provider-badge-pill">${escapeHtml(p.badge)}</span>
          </div>
          <div class="provider-limits">вљЎ ${escapeHtml(p.freeTierInfo)}</div>
          <div class="provider-popular">Models: <code>${escapeHtml(p.popularModels)}</code></div>
        </div>

        <div>
          <div class="provider-keys-summary">
            <span>Status:</span>
            ${statusBadge}
          </div>

          <div class="provider-card-actions">
            ${!isLocalOrMock && !p.isNoAuth ? `
              <button class="btn-action-signup" onclick="openAutoRegistration('${p.id}', '${escapeHtml(p.name)}', '${p.getKeyUrl}', '${escapeHtml(p.guide)}')">
                рџљЂ Ro'yxatdan O'tish в†—
              </button>
              <button class="btn-secondary" style="padding: 0.45rem 0.85rem; font-size: 0.8rem;" onclick="openAddKeyModal('${p.id}', '${escapeHtml(p.name)}', '${escapeHtml(p.guide)}')">
                + Kalit Qo'shish
              </button>
            ` : `
              <button class="btn-secondary" style="padding: 0.45rem 0.85rem; font-size: 0.8rem;" onclick="testProviderPing('${p.id}', this)">
                рџ§Є Ping
              </button>
              <button class="btn-primary" style="padding: 0.45rem 0.85rem; font-size: 0.8rem; background: linear-gradient(135deg, #00f5d4, #7b2cbf);" onclick="switchPlaygroundModel('${p.id}')">
                рџ’¬ Sinash (Zero-Key)
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.testProviderPing = async function(providerId, btn) {
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'вЏі ...';
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
      btn.textContent = 'рџ§Є Ping';
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
    const coolText = isCool ? `вЏі Cooldown (${Math.ceil((k.cooldown_until - Date.now()) / 1000)}s)` : 'рџџў Ready';

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
              ${idx < Math.min(4, c.targets.length - 1) ? '<span class="chain-arrow">в†’</span>' : ''}
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
      ? `Showing ${startIdx + 1}вЂ“${endIdx} of ${totalFiltered} free models`
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
            Playground рџ’¬
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
  if (btn) btn.innerHTML = 'рџ”„ Scanning...';

  try {
    const res = await fetch(`${API_BASE}/api/models/scan`, { method: 'POST' });
    const data = await res.json();
    showToast(`Scan complete: Discovered ${data.totalActiveFreeModels} free models!`, 'success');
    await loadModels();
    await loadStats();
  } catch (err) {
    showToast('Scan error: ' + err.message, 'error');
  } finally {
    if (btn) btn.innerHTML = 'рџ”„ Scan & Refresh Models';
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
          <button class="btn-copy-small" onclick="copyText('${escapeHtml(k.key)}')" title="Copy Key">рџ“‹</button>
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
  if (!confirm(`Revoke key ${key}? AI Agent & Developer Hub using this key will lose access.`)) return;
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

// AI Agent & Developer Hub Handshake Tester
function initHandshakeTester() {
  document.getElementById('btn-test-handshake')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-test-handshake');
    const badge = document.getElementById('handshake-badge');
    const meta = document.getElementById('handshake-meta');

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'вЏі Testing...';
    }
    if (badge) {
      badge.className = 'handshake-badge testing';
      badge.textContent = 'в—Џ Probing Gateway...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/handshake`);
      const data = await res.json();

      if (data.success) {
        if (badge) {
          badge.className = 'handshake-badge live';
          badge.textContent = `рџџў Connected & Ready (${data.latencyMs || 1}ms)`;
        }
        if (meta) {
          meta.innerHTML = `<strong>Handshake OK!</strong> Active Free Models: <code>${data.activeFreeModels}</code> | Client Keys: <code>${data.clientKeysActive}</code> | Endpoint: <code>${data.endpoint}</code>`;
        }
        showToast('AI Applications & IDEs Handshake Successful!', 'success');
      } else {
        throw new Error(data.error || 'Handshake failed');
      }
    } catch (err) {
      if (badge) {
        badge.className = 'handshake-badge error';
        badge.textContent = 'рџ”ґ Connection Error';
      }
      if (meta) meta.textContent = 'Error: ' + err.message;
      showToast('Handshake failed: ' + err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'рџ§Є Test Handshake';
      }
    }
  });

  document.getElementById('btn-simulate-agent')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-simulate-agent');
    const badge = document.getElementById('handshake-badge');
    const meta = document.getElementById('handshake-meta');

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'вЏі Simulating DAG...';
    }
    if (badge) {
      badge.className = 'handshake-badge testing';
      badge.textContent = 'в—Џ Executing AI Agent & Developer Hub DAG Wave...';
    }

    try {
      const res = await fetch(`${API_BASE}/api/integrations/simulate`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        if (badge) {
          badge.className = 'handshake-badge live';
          badge.textContent = `рџџў DAG Simulation PASSED (${data.totalLatencyMs}ms)`;
        }
        if (meta) {
          const stepSummary = data.steps.map(s => `вњ“ ${s.step}: <strong>${s.provider}</strong> (${s.model})`).join(' | ');
          meta.innerHTML = `<strong>Autonomous Pipeline Execution Success!</strong> ${stepSummary}`;
        }
        showToast('AI Applications & IDEs DAG Simulation Succeeded!', 'success');
      } else {
        throw new Error(data.error || 'Simulation failed');
      }
    } catch (err) {
      if (badge) {
        badge.className = 'handshake-badge error';
        badge.textContent = 'рџ”ґ Simulation Failed';
      }
      if (meta) meta.textContent = 'Error: ' + err.message;
      showToast('Simulation error: ' + err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'рџљЂ Simulate 2-Step DAG';
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
    if (pill) pill.textContent = `вљЎ ${modelSelect.value}`;
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
          <div class="bubble-header">вљЎ Extra LLM X System</div>
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
  initWebSearchStudio();
  initCodeSandboxStudio();
  initCompactorStudio();
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

// вљ”пёЏ Model Arena (Battle Side-by-Side) Controller
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
          'Authorization': 'Bearer elx-live-master-free-hub'
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
      statsEl.textContent = `${latency}ms вЂў ${tokPerSec} tok/s`;
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
        statsA.innerHTML = `рџ‘‘ FASTEST (${timeA}ms вЂў ${tokA} tok/s)`;
      } else if (timeB < timeA && timeB < 900000) {
        statsB.classList.add('winner');
        statsB.innerHTML = `рџ‘‘ FASTEST (${timeB}ms вЂў ${tokB} tok/s)`;
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

// рџЋЁ Flux Image Studio Controller
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
    genBtn.innerHTML = 'рџЋЁ Generating via Pollinations Flux...';
    placeholder?.classList.remove('hidden');
    resultBox?.classList.add('hidden');

    try {
      const res = await fetch(`${API_BASE}/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer elx-live-master-free-hub'
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
      genBtn.innerHTML = '<span>рџЋЁ Generate Free Image ($0)</span>';
    }
  });

  copyUrlBtn?.addEventListener('click', () => {
    if (lastGeneratedUrl) {
      copyText(lastGeneratedUrl, copyUrlBtn);
    }
  });
}

// рџ§¬ Embeddings Studio Controller
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
    computeBtn.innerHTML = 'рџ§¬ Computing 1536-dim embeddings...';

    try {
      const res = await fetch(`${API_BASE}/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer elx-live-master-free-hub'
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
      computeBtn.innerHTML = '<span>рџ§¬ Calculate Embeddings & Cosine Similarity</span>';
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

  const assistantBubble = appendChatBubble('assistant', `вљЎ Extra LLM X (${model})`, '');
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
        'Authorization': 'Bearer elx-live-master-free-hub'
      },
      body: JSON.stringify({
        model,
        messages: messagesToSend,
        stream: true,
        temperature,
        max_tokens: maxTokens,
        web_search: document.getElementById('check-web-search')?.checked || false,
        compact_context: document.getElementById('check-compact-context')?.checked || false,
        tools: document.getElementById('check-tools-polyfill')?.checked ? [
          {
            type: 'function',
            function: {
              name: 'web_search',
              description: 'Search live internet data',
              parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
            }
          },
          {
            type: 'function',
            function: {
              name: 'execute_code',
              description: 'Execute Python or JS code in sandbox',
              parameters: { type: 'object', properties: { language: { type: 'string' }, code: { type: 'string' } }, required: ['code'] }
            }
          }
        ] : undefined
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
      contentEl.innerHTML = `<span style="color: #ef4444;">вќЊ Error: ${escapeHtml(err.message)}</span>`;
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
      <button class="btn-copy-small" onclick="copyBubbleText(this)" title="Copy Message">рџ“‹</button>
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
      if (elCap) elCap.textContent = summary.monthlyCapacityPool || '5B+';
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
    const rankMedal = r.rank === 1 ? 'рџҐ‡ #1' : r.rank === 2 ? 'рџҐ€ #2' : r.rank === 3 ? 'рџҐ‰ #3' : `#${r.rank}`;
    const statusBadge = r.isConfigured
      ? `<span class="tag-status live">в—Џ Active</span>`
      : r.isNoAuth
        ? `<span class="tag-status live" style="background:rgba(0,245,212,0.15);color:var(--accent-cyan);border-color:var(--accent-cyan);">вљЎ Zero-Key Live</span>`
        : `<span class="tag-status standby">в—‹ Key Needed</span>`;

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
          No telemetry requests recorded. Send queries from AI Applications & IDEs or the Playground!
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
          ${l.fallback_occurred ? '<span style="color: var(--accent-amber); font-weight: 700;">вљЎ Failover</span>' : '<span style="color: var(--text-muted);">Direct</span>'}
        </td>
        <td>
          <button class="btn-secondary btn-sm" onclick="inspectTelemetryLog('${escapeHtml(l.id)}')">
            рџ”Ќ Inspect
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

  const modalWebhook = document.getElementById('modal-create-webhook');
  document.getElementById('btn-open-create-webhook')?.addEventListener('click', () => {
    const urlInput = document.getElementById('input-webhook-url');
    const evInput = document.getElementById('input-webhook-events');
    const secInput = document.getElementById('input-webhook-secret');
    const outBox = document.getElementById('webhook-test-output');
    if (urlInput) urlInput.value = '';
    if (evInput) evInput.value = 'all';
    if (secInput) secInput.value = '';
    outBox?.classList.add('hidden');
    modalWebhook?.classList.add('active');
  });
  document.getElementById('btn-close-webhook-modal')?.addEventListener('click', () => modalWebhook?.classList.remove('active'));
  document.getElementById('btn-cancel-webhook')?.addEventListener('click', () => modalWebhook?.classList.remove('active'));
  document.getElementById('btn-save-webhook')?.addEventListener('click', saveModalWebhook);
  document.getElementById('btn-modal-test-webhook')?.addEventListener('click', testModalWebhook);
  document.getElementById('btn-refresh-webhooks')?.addEventListener('click', () => {
    loadWebhooks();
    showToast('Webhooks refreshed', 'success');
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

  const saveBtn = document.getElementById('btn-modal-save-key');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-sm"></span> Auto-Discovering...';
  }

  try {
    // Use auto-discover for the full pipeline
    const res = await fetch(`${API_BASE}/api/providers/auto-discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, label: label || `${provider} Key` })
    });

    const data = await res.json();

    if (data.success) {
      // Show detailed success in the test output area
      const outputEl = document.getElementById('modal-test-output');
      if (outputEl) {
        outputEl.classList.remove('hidden');
        outputEl.className = 'modal-test-output success';
        const modelList = (data.modelsRegistered || []).slice(0, 5).map(m => m.display_name || m.model_id).join(', ');
        const moreCount = (data.modelsDiscovered || 0) > 5 ? ` +${data.modelsDiscovered - 5} more` : '';
        outputEl.innerHTML = `
          <div style="margin-bottom:0.5rem;font-weight:600;">вњ… ${provider.toUpperCase()} Activated!</div>
          <div>рџ§Є Test: <strong>${data.testedModel || 'OK'}</strong> (${data.testLatencyMs || 0}ms)</div>
          <div>рџ“¦ Models Discovered: <strong>${data.modelsDiscovered || 0}</strong></div>
          <div style="font-size:0.8rem;opacity:0.8;margin-top:0.3rem;">${modelList}${moreCount}</div>
          <div>рџ’ѕ Key Saved: <strong>${data.keySaved ? 'Yes' : 'No'}</strong></div>
        `;
      }

      showToast(`${provider.toUpperCase()}: ${data.modelsDiscovered} free model activated!`, 'success');
      
      // Refresh providers and models
      loadProviders();
      loadModels();

      // Close modal after a short delay so user sees the results
      setTimeout(() => {
        document.getElementById('modal-add-key').classList.remove('active');
      }, 2500);
    } else {
      const outputEl = document.getElementById('modal-test-output');
      if (outputEl) {
        outputEl.classList.remove('hidden');
        outputEl.className = 'modal-test-output error';
        outputEl.textContent = `вќЊ ${data.message || data.error || 'Activation failed'}`;
      }
      showToast('Error: ' + (data.message || data.error), 'error');
    }
  } catch (err) {
    showToast('Failed to save key: ' + err.message, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'рџ’ѕ Auto-Discover & Save';
    }
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

  const testBtn = document.getElementById('btn-modal-test-key');
  if (testBtn) {
    testBtn.disabled = true;
    testBtn.innerHTML = '<span class="spinner-sm"></span> Testing & Discovering...';
  }

  outputEl.classList.remove('hidden');
  outputEl.className = 'modal-test-output';
  outputEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.5rem;">
      <span class="spinner-sm"></span>
      <span>Phase 1/3: Validating API key...</span>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/api/providers/auto-discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        apiKey,
        label: document.getElementById('modal-input-label').value.trim() || `${provider} Free Key`
      })
    });

    const data = await res.json();

    if (data.success) {
      const modelList = (data.modelsRegistered || []).slice(0, 8).map(m => {
        const name = m.display_name || m.model_id;
        const ctx = m.context_window ? ` (${Math.round(m.context_window / 1024)}K ctx)` : '';
        return `<div style="padding:0.15rem 0;font-size:0.78rem;">  вЂў ${name}${ctx}</div>`;
      }).join('');
      const moreCount = (data.modelsDiscovered || 0) > 8 ? `<div style="font-size:0.75rem;opacity:0.7;">  ... +${data.modelsDiscovered - 8} more models</div>` : '';

      outputEl.className = 'modal-test-output success';
      outputEl.innerHTML = `
        <div style="margin-bottom:0.4rem;font-weight:700;font-size:1.05rem;">
          вњ… ${provider.toUpperCase()} вЂ” Fully Activated!
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.3rem 1rem;margin:0.4rem 0;">
          <div>рџ§Є Inference Test:</div><div style="font-weight:600;">${data.testPassed ? 'PASSED' : 'SKIPPED'} (${data.testLatencyMs || 0}ms)</div>
          <div>рџ“¦ Free Models Found:</div><div style="font-weight:600;">${data.modelsDiscovered || 0}</div>
          <div>рџ’ѕ Key Saved:</div><div style="font-weight:600;">${data.keySaved ? 'вњ… Yes' : 'вќЊ No'}</div>
          <div>вЏ±пёЏ Total Time:</div><div style="font-weight:600;">${data.totalLatencyMs || 0}ms</div>
        </div>
        ${data.testReply ? `<div style="margin:0.3rem 0;font-size:0.8rem;opacity:0.85;">рџ’¬ Reply: "${data.testReply}"</div>` : ''}
        <div style="margin-top:0.5rem;font-weight:600;font-size:0.85rem;">рџ“‹ Registered Models:</div>
        ${modelList}${moreCount}
      `;

      showToast(`рџљЂ ${provider.toUpperCase()}: ${data.modelsDiscovered} free models auto-discovered and activated!`, 'success');
      
      // Refresh data
      loadProviders();
      loadModels();

      // Close modal after user has time to read results
      setTimeout(() => {
        document.getElementById('modal-add-key').classList.remove('active');
      }, 4000);
    } else {
      outputEl.className = 'modal-test-output error';
      outputEl.innerHTML = `
        <div style="font-weight:600;">вќЊ Activation Failed</div>
        <div style="margin-top:0.3rem;font-size:0.85rem;">${data.message || data.error || 'Unknown error'}</div>
        ${data.errors ? `<div style="margin-top:0.3rem;font-size:0.78rem;opacity:0.8;">${data.errors.join('<br>')}</div>` : ''}
      `;
      showToast(`${provider.toUpperCase()}: Test failed`, 'error');
    }
  } catch (err) {
    outputEl.className = 'modal-test-output error';
    outputEl.textContent = `вќЊ Error: ${err.message}`;
  } finally {
    if (testBtn) {
      testBtn.disabled = false;
      testBtn.innerHTML = 'рџ§Є Test & Auto-Discover';
    }
  }
}

async function createSystemKey() {
  const name = document.getElementById('input-sys-key-name').value.trim();
  const rateLimit = parseInt(document.getElementById('input-sys-key-rate').value || '120', 10);

  try {
    const res = await fetch(`${API_BASE}/api/system-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || 'AI Agent & Developer Hub Key', rateLimit })
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
    link.download = 'integrations-HP.env';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded integrations-HP.env file', 'success');
  });
}

window.copyText = function(text, btnElement) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success');
    if (btnElement && btnElement.tagName) {
      const originalHtml = btnElement.innerHTML;
      btnElement.classList.add('btn-copied');
      btnElement.innerHTML = 'вњ“ Copied!';
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
  let icon = 'вљЎ';
  if (type === 'error') icon = 'вќЊ';
  else if (type === 'warning') icon = 'вљ пёЏ';
  else if (type === 'info') icon = 'в„№пёЏ';

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

    // Number keys 1-9 switch tabs when not typing
    if (!isTyping && e.key >= '1' && e.key <= '9') {
      const tabs = [
        'tab-cockpit',
        'tab-providers',
        'tab-models',
        'tab-keys',
        'tab-gateway',
        'tab-playground',
        'tab-rankings',
        'tab-logs',
        'tab-webhooks'
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
    if (btn) btn.innerHTML = 'рџЊ™ Midnight';
  } else if (theme === 'light') {
    document.body.classList.add('theme-light');
    if (btn) btn.innerHTML = 'вЂпёЏ Light';
  } else {
    if (btn) btn.innerHTML = 'вљЎ Neon';
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
      btn.innerHTML = 'вЏі Probing endpoints...';
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
        btn.innerHTML = '<span class="btn-icon">вљЎ</span> Run Full Diagnostics';
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

// рџ’° Interactive ROI & Savings Calculator
function initRoiCalculator() {
  const slider = document.getElementById('roi-token-slider');
  const tokenDisplay = document.getElementById('roi-token-display');
  const gptCostEl = document.getElementById('roi-gpt4o-cost');
  const claudeCostEl = document.getElementById('roi-claude-cost');
  const savingsEl = document.getElementById('roi-annual-savings');
  const presetChips = document.querySelectorAll('.btn-roi-preset');

  if (!slider) return;

  const updateCalculations = (tokens) => {
    const millions = tokens / 1000000;
    // Commercial rates:
    // GPT-4o: ~$5.00 / 1M tokens ($2.50 input / $10 output avg)
    // Claude 3.5 Sonnet: ~$15.00 / 1M tokens ($3.00 input / $15 output avg)
    const gptCost = millions * 5.0;
    const claudeCost = millions * 15.0;
    const avgMonthly = (gptCost + claudeCost) / 2;
    const annualSavings = avgMonthly * 12;

    if (tokenDisplay) {
      tokenDisplay.textContent = `${Number(tokens).toLocaleString()} tokens`;
    }
    if (gptCostEl) {
      gptCostEl.textContent = `$${gptCost.toFixed(2)} / mo`;
    }
    if (claudeCostEl) {
      claudeCostEl.textContent = `$${claudeCost.toFixed(2)} / mo`;
    }
    if (savingsEl) {
      savingsEl.textContent = `$${annualSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / year`;
    }
  };

  slider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    updateCalculations(val);
  });

  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = parseInt(chip.getAttribute('data-roivals'), 10);
      if (val && slider) {
        slider.value = val;
        updateCalculations(val);
        presetChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      }
    });
  });

  updateCalculations(parseInt(slider.value || '5000000', 10));
}

// рџ”” Webhooks & Alert Subscriptions Controller
async function loadWebhooks() {
  try {
    const res = await fetch(`${API_BASE}/api/webhooks`);
    if (!res.ok) return;
    const data = await res.json();
    allWebhooks = data.webhooks || [];
    renderWebhooksTable();
  } catch (err) {
    console.warn('Webhooks load error:', err.message);
  }
}

function renderWebhooksTable() {
  const tbody = document.getElementById('tbody-webhooks');
  if (!tbody) return;

  if (allWebhooks.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
          No alert webhooks registered yet. Click <strong>"+ Add Webhook"</strong> to stream real-time events to Discord, Slack, or AI Agent & Developer Hub!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = allWebhooks.map(w => {
    const eventsBadges = (w.events || 'all').split(',').map(e => 
      `<span class="model-tag">${escapeHtml(e.trim())}</span>`
    ).join(' ');

    const lastTriggered = w.last_triggered_at 
      ? new Date(w.last_triggered_at).toLocaleTimeString() 
      : 'Never';

    return `
      <tr>
        <td><code>${escapeHtml(w.id)}</code></td>
        <td style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <a href="${escapeHtml(w.url)}" target="_blank" rel="noopener" style="color: var(--accent-cyan); text-decoration: none;">
            ${escapeHtml(w.url)}
          </a>
        </td>
        <td><div style="display: flex; gap: 4px; flex-wrap: wrap;">${eventsBadges}</div></td>
        <td>
          <span class="tag-status ${w.active ? 'live' : 'standby'}">
            ${w.active ? 'в—Џ Active' : 'в—‹ Paused'}
          </span>
        </td>
        <td>
          <span style="color: ${w.failure_count > 0 ? '#ef4444' : 'var(--text-muted)'}; font-weight: ${w.failure_count > 0 ? '700' : '400'};">
            ${w.failure_count}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-secondary btn-sm" onclick="testSingleWebhook('${escapeHtml(w.url)}')" title="Send test ping">
              рџ§Є Ping
            </button>
            <button class="btn-secondary btn-sm" onclick="toggleWebhookActive('${escapeHtml(w.id)}', ${w.active ? 0 : 1})">
              ${w.active ? 'вЏё Pause' : 'в–¶ Resume'}
            </button>
            <button class="btn-danger-outline btn-sm" onclick="deleteWebhook('${escapeHtml(w.id)}')" title="Delete webhook">
              рџ—‘пёЏ
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function saveModalWebhook() {
  const url = (document.getElementById('input-webhook-url')?.value || '').trim();
  const events = (document.getElementById('input-webhook-events')?.value || 'all').trim();
  const secret = (document.getElementById('input-webhook-secret')?.value || '').trim();

  if (!url || !url.startsWith('http')) {
    showToast('Please enter a valid HTTP/HTTPS webhook URL', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, events, secret: secret || null })
    });

    if (res.ok) {
      showToast('Webhook registered successfully!', 'success');
      document.getElementById('modal-create-webhook')?.classList.remove('active');
      loadWebhooks();
    } else {
      const err = await res.json();
      showToast('Error: ' + (err.error || 'Failed to save'), 'error');
    }
  } catch (err) {
    showToast('Failed to save webhook: ' + err.message, 'error');
  }
}

async function testModalWebhook() {
  const url = (document.getElementById('input-webhook-url')?.value || '').trim();
  const secret = (document.getElementById('input-webhook-secret')?.value || '').trim();
  const outputEl = document.getElementById('webhook-test-output');

  if (!url || !url.startsWith('http')) {
    showToast('Please enter a valid webhook URL to test', 'error');
    return;
  }

  if (outputEl) {
    outputEl.classList.remove('hidden');
    outputEl.className = 'modal-test-output';
    outputEl.textContent = 'Dispatching test alert payload...';
  }

  try {
    const res = await fetch(`${API_BASE}/api/webhooks/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, secret: secret || null })
    });

    const data = await res.json();
    if (data.success) {
      if (outputEl) {
        outputEl.className = 'modal-test-output success';
        outputEl.textContent = `вњ… Webhook ping delivered! Target HTTP status: ${data.result?.status}`;
      }
      showToast('Webhook ping delivered successfully!', 'success');
    } else {
      if (outputEl) {
        outputEl.className = 'modal-test-output error';
        outputEl.textContent = `вќЊ Ping failed: ${data.result?.error || 'HTTP ' + data.result?.status}`;
      }
      showToast('Ping failed: ' + (data.result?.error || 'Server error'), 'error');
    }
  } catch (err) {
    if (outputEl) {
      outputEl.className = 'modal-test-output error';
      outputEl.textContent = `вќЊ Error: ${err.message}`;
    }
  }
}

window.testSingleWebhook = async function(url) {
  showToast('Sending test ping to webhook...', 'info');
  try {
    const res = await fetch(`${API_BASE}/api/webhooks/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Webhook test delivered successfully!', 'success');
    } else {
      showToast(`Ping failed: ${data.result?.error || 'HTTP ' + data.result?.status}`, 'error');
    }
  } catch (err) {
    showToast('Ping error: ' + err.message, 'error');
  }
};

window.toggleWebhookActive = async function(id, newActive) {
  try {
    const res = await fetch(`${API_BASE}/api/webhooks/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: Boolean(newActive) })
    });
    if (res.ok) {
      showToast(`Webhook ${newActive ? 'activated' : 'paused'}`, 'success');
      loadWebhooks();
    }
  } catch (err) {
    showToast('Failed to update webhook: ' + err.message, 'error');
  }
};

window.deleteWebhook = async function(id) {
  if (!confirm('Are you sure you want to delete this webhook subscription?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/webhooks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Webhook deleted', 'success');
      loadWebhooks();
    }
  } catch (err) {
    showToast('Failed to delete webhook: ' + err.message, 'error');
  }
};

/* ==========================================================================
   UPGRADE STUDIOS: WEB SEARCH, SANDBOX, COMPACTOR
   ========================================================================== */

function initWebSearchStudio() {
  const queryInput = document.getElementById('input-search-query');
  const limitSelect = document.getElementById('select-search-limit');
  const searchBtn = document.getElementById('btn-run-web-search');
  const resultsContainer = document.getElementById('search-results-container');
  const chips = document.querySelectorAll('.search-chip-btn');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      if (q && queryInput) {
        queryInput.value = q;
        searchBtn?.click();
      }
    });
  });

  searchBtn?.addEventListener('click', async () => {
    const q = (queryInput?.value || '').trim();
    if (!q) {
      showToast('Please enter a search query', 'error');
      return;
    }

    const limit = parseInt(limitSelect?.value || '5', 10);
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<span>вЏі Searching DuckDuckGo...</span>';
    resultsContainer.innerHTML = '<div class="empty-state-card">Fetching live results from DuckDuckGo...</div>';

    try {
      const res = await fetch(`${API_BASE}/v1/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer elx-live-master-free-hub'
        },
        body: JSON.stringify({ query: q, limit })
      });

      if (!res.ok) throw new Error(`Search failed with status ${res.status}`);
      const data = await res.json();
      const results = data.data || [];

      if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="empty-state-card">No results found for this query. Try another query.</div>';
        return;
      }

      resultsContainer.innerHTML = results.map((r, i) => `
        <div class="search-result-card">
          <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="search-result-title">${i + 1}. ${escapeHtml(r.title)}</a>
          <span class="search-result-url">${escapeHtml(r.url)}</span>
          <p class="search-result-snippet">${escapeHtml(r.snippet)}</p>
        </div>
      `).join('');

      showToast(`Found ${results.length} live search results`, 'success');
    } catch (err) {
      resultsContainer.innerHTML = `<div class="empty-state-card" style="color: #ff5252;">Search error: ${escapeHtml(err.message)}</div>`;
      showToast(err.message, 'error');
    } finally {
      searchBtn.disabled = false;
      searchBtn.innerHTML = '<span>рџ”Ќ Search Live Web</span>';
    }
  });
}

function initCodeSandboxStudio() {
  const langSelect = document.getElementById('select-sandbox-lang');
  const presetSelect = document.getElementById('select-sandbox-preset');
  const codeArea = document.getElementById('textarea-sandbox-code');
  const runBtn = document.getElementById('btn-run-sandbox');
  const stdoutEl = document.getElementById('sandbox-stdout');
  const stderrEl = document.getElementById('sandbox-stderr');
  const statusBadge = document.getElementById('badge-sandbox-status');
  const timeBadge = document.getElementById('badge-sandbox-time');

  const templates = {
    'js-bench': `// JS Performance Benchmark
console.log('--- Extra LLM X Benchmark ---');
const t0 = Date.now();
let count = 0;
for (let i = 0; i < 2000000; i++) {
  count += (i % 2 === 0 ? 1 : 0);
}
console.log('Even numbers count:', count);
console.log('Completed in:', Date.now() - t0, 'ms');`,

    'js-matrix': `// JS Fibonacci Sequence
const fib = (n) => (n <= 1 ? n : fib(n - 1) + fib(n - 2));
console.log('Fibonacci sequence test:');
for (let i = 1; i <= 15; i++) {
  console.log(\`fib(\${i}) = \${fib(i)}\`);
}`,

    'py-math': `# Python Prime Sieve
def sieve(n):
    primes = []
    is_prime = [True] * (n + 1)
    for p in range(2, n + 1):
        if is_prime[p]:
            primes.append(p)
            for i in range(p * p, n + 1, p):
                is_prime[i] = False
    return primes

primes_100 = sieve(100)
print(f"Primes up to 100 ({len(primes_100)} total):")
print(primes_100)`,

    'py-system': `# Python System Telemetry
import sys, platform, time

print("Extra LLM X Isolated Sandbox Environment:")
print("Platform:", platform.system(), platform.release())
print("Python Version:", sys.version.split()[0])
print("System Epoch Time:", int(time.time()))
print("Status: 100% Operational")`
  };

  presetSelect?.addEventListener('change', () => {
    const val = presetSelect.value;
    if (templates[val] && codeArea) {
      codeArea.value = templates[val];
      if (val.startsWith('py')) {
        langSelect.value = 'python';
      } else {
        langSelect.value = 'javascript';
      }
    }
  });

  runBtn?.addEventListener('click', async () => {
    const code = (codeArea?.value || '').trim();
    if (!code) {
      showToast('Please enter code to execute', 'error');
      return;
    }

    const language = langSelect?.value || 'javascript';
    runBtn.disabled = true;
    runBtn.innerHTML = '<span>вЏі Running code...</span>';
    statusBadge.textContent = 'Running...';
    statusBadge.className = 'badge badge-warning';
    stdoutEl.textContent = '// Running...';
    stderrEl.classList.add('hidden');

    try {
      const res = await fetch(`${API_BASE}/v1/sandbox/eval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer elx-live-master-free-hub'
        },
        body: JSON.stringify({ language, code, timeoutMs: 5000 })
      });

      const data = await res.json();
      timeBadge.textContent = `${data.durationMs}ms`;

      if (data.success) {
        statusBadge.textContent = `Exit: 0 (Success)`;
        statusBadge.className = 'badge badge-success';
        stdoutEl.textContent = data.stdout || '(No stdout output)';
        stderrEl.classList.add('hidden');
        showToast(`Executed in ${data.durationMs}ms`, 'success');
      } else {
        statusBadge.textContent = `Exit: ${data.exitCode} (Failed)`;
        statusBadge.className = 'badge badge-danger';
        stdoutEl.textContent = data.stdout || '(No stdout output)';
        if (data.stderr) {
          stderrEl.textContent = data.stderr;
          stderrEl.classList.remove('hidden');
        }
        showToast('Execution error or timeout', 'error');
      }
    } catch (err) {
      statusBadge.textContent = 'Error';
      statusBadge.className = 'badge badge-danger';
      stderrEl.textContent = err.message;
      stderrEl.classList.remove('hidden');
      showToast(err.message, 'error');
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = '<span>вљЎ Run Code in Sandbox</span>';
    }
  });
}

function initCompactorStudio() {
  const loadBtn = document.getElementById('btn-load-sample-dialog');
  const runBtn = document.getElementById('btn-run-compactor');
  const maxInput = document.getElementById('input-compactor-max');
  const previewOrig = document.getElementById('preview-orig-messages');
  const previewCompact = document.getElementById('preview-compact-messages');
  const countOrig = document.getElementById('count-orig-msgs');
  const countCompact = document.getElementById('count-compact-msgs');
  const valBefore = document.getElementById('metric-tokens-before');
  const valAfter = document.getElementById('metric-tokens-after');
  const valSaved = document.getElementById('metric-tokens-saved');
  const valStatus = document.getElementById('metric-compacted-status');

  let currentMessages = [];

  const sampleDialog = [
    { role: 'system', content: 'You are an AI coding assistant and architect for Extra LLM X.' },
    { role: 'user', content: 'We need to design a scalable high-performance LLM gateway that aggregates 26+ free AI model providers with zero latency overhead.' },
    { role: 'assistant', content: 'I recommend creating adapter abstractions for each vendor (Groq, Cerebras, SambaNova, OpenRouter, Mistral, HuggingFace, etc.) with unified response parsing and failover combos.' },
    { role: 'user', content: 'What about caching and rate limit mitigation? We need to ensure free tier keys do not get overwhelmed.' },
    { role: 'assistant', content: 'We can implement a dual-tier L1 in-memory LRU cache with L2 SQLite WAL persistence for 0ms repeat requests, along with exponential lockout circuit breakers and multi-key rotation.' },
    { role: 'user', content: 'How should AI Applications & IDEs connect to this server seamlessly?' },
    { role: 'assistant', content: 'We can configure EXTRA_LLM_X_BASE_URL to point to http://localhost:3000/v1 and generate cryptographic elx-... system keys with instant OpenAI SDK drop-in compatibility.' },
    { role: 'user', content: 'Can we add live web search grounding without paying for external search APIs?' },
    { role: 'assistant', content: 'Yes! We built FreeSearchEngine using direct DuckDuckGo HTML and instant answer parsers with automated citation prompt grounding.' },
    { role: 'user', content: 'Now summarize the entire architecture and implementation status.' }
  ];

  loadBtn?.addEventListener('click', () => {
    currentMessages = JSON.parse(JSON.stringify(sampleDialog));
    previewOrig.textContent = JSON.stringify(currentMessages, null, 2);
    countOrig.textContent = currentMessages.length;
    showToast('Loaded sample 10-turn conversation history', 'info');
  });

  runBtn?.addEventListener('click', async () => {
    if (currentMessages.length === 0) {
      loadBtn?.click();
    }

    const maxTokens = parseInt(maxInput?.value || '150', 10);
    runBtn.disabled = true;
    runBtn.innerHTML = '<span>вЏі Compacting...</span>';

    try {
      const res = await fetch(`${API_BASE}/v1/compactor/compact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer elx-live-master-free-hub'
        },
        body: JSON.stringify({
          messages: currentMessages,
          maxTokens,
          keepRecent: 2
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      valBefore.textContent = data.tokensBefore;
      valAfter.textContent = data.tokensAfter;
      valSaved.textContent = `${data.tokensSaved || 0} (${data.tokensBefore ? Math.round(((data.tokensSaved || 0) / data.tokensBefore) * 100) : 0}%)`;
      valStatus.textContent = data.compacted ? 'YES' : 'NO';
      valStatus.className = data.compacted ? 'stat-val highlight-neon' : 'stat-val';

      countCompact.textContent = data.messages.length;
      previewCompact.textContent = JSON.stringify(data.messages, null, 2);

      showToast(`Context compacted! Saved ${data.tokensSaved || 0} tokens`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = '<span>рџ—њпёЏ Run Smart Compaction</span>';
    }
  });
}

window.openAutoRegistration = function(providerId, providerName, portalUrl, guide) {
  // 1. Automatically launch the free provider portal in a new tab
  if (portalUrl && portalUrl !== '#') {
    window.open(portalUrl, '_blank');
  }

  // 2. Open Add Key Modal pre-configured with guided assistance
  const modal = document.getElementById('modal-add-key');
  document.getElementById('modal-key-provider').value = providerId;
  document.getElementById('modal-provider-badge').textContent = providerName;
  document.getElementById('modal-field-help').textContent = guide || 'Get your free key from the opened tab';
  document.getElementById('modal-input-key').value = '';
  document.getElementById('modal-input-label').value = `${providerName} Free Key`;
  document.getElementById('modal-test-output').classList.add('hidden');

  const portalLinkEl = document.getElementById('modal-btn-open-portal');
  if (portalLinkEl) {
    portalLinkEl.href = (portalUrl && portalUrl !== '#') ? portalUrl : '#';
  }

  modal.classList.add('active');
  showToast(`${providerName} ro'yxatdan o'tish portali yangi oynada ochildi!`, 'info');
};

window.switchPlaygroundModel = function(providerId) {
  // Switch to Playground tab
  const btnPlayground = document.getElementById('btn-nav-playground');
  btnPlayground?.click();

  // Switch to Single Chat mode
  const btnChat = document.getElementById('btn-pmode-chat');
  btnChat?.click();

  // Try to select model
  const selectModel = document.getElementById('select-play-model');
  if (selectModel) {
    for (const opt of selectModel.options) {
      if (opt.value.startsWith(providerId + '/') || opt.value === providerId) {
        selectModel.value = opt.value;
        break;
      }
    }
  }

  showToast(`${providerId.toUpperCase()} modeli tanlandi! Savol yozib sinab ko'ring.`, 'success');
};

