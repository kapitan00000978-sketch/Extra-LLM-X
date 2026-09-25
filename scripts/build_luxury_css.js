import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const cssContent = `/* ==========================================================================
   EXTRA LLM X — ENTERPRISE DEVELOPER DESIGN SYSTEM
   Standard: Linear / Vercel / Supabase Dark Mode Architecture
   ========================================================================== */

:root {
  /* Surface Tokens */
  --bg-app: #08090d;
  --bg-subtle: #0d0f17;
  --bg-surface: #121520;
  --bg-surface-hover: #181c2b;
  --bg-surface-active: #1f2438;
  --bg-input: #0a0c13;
  --bg-overlay: rgba(8, 9, 13, 0.85);

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-strong: rgba(255, 255, 255, 0.18);
  --border-focus: #00f0ff;

  /* Text Tokens */
  --text-primary: #f1f3f7;
  --text-secondary: #9aa1b2;
  --text-tertiary: #636b7e;
  --text-disabled: #434958;

  /* Brand Accents */
  --accent-primary: #00f0ff;
  --accent-primary-hover: #33f3ff;
  --accent-primary-subtle: rgba(0, 240, 255, 0.1);
  --accent-emerald: #10b981;
  --accent-emerald-subtle: rgba(16, 185, 129, 0.12);
  --accent-purple: #8b5cf6;
  --accent-purple-subtle: rgba(139, 92, 246, 0.12);
  --accent-amber: #f59e0b;
  --accent-amber-subtle: rgba(245, 158, 11, 0.12);
  --accent-rose: #f43f5e;
  --accent-rose-subtle: rgba(244, 63, 94, 0.12);

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Dimensions & Radius */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Elevation */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 12px 32px -4px rgba(0, 0, 0, 0.75);
}

/* ==========================================================================
   Reset & Global
   ========================================================================== */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 14px;
  color-scheme: dark;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-app);
  color: var(--text-primary);
  min-height: 100vh;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--bg-app);
}
::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: var(--radius-full);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* ==========================================================================
   Header Navbar
   ========================================================================== */
.app-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(8, 9, 13, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
}

.navbar-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand-group {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.brand-symbol {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, #00f0ff, #8b5cf6);
  color: #08090d;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-name {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.brand-version {
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  margin-left: 4px;
}

.system-status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  background: var(--accent-emerald-subtle);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--accent-emerald);
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-emerald);
  box-shadow: 0 0 6px var(--accent-emerald);
}

/* Segmented Control Navigation */
.nav-segmented-control {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--bg-subtle);
  padding: 3px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  overflow-x: auto;
}

.nav-item {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.82rem;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-surface);
}

.nav-item.active {
  color: var(--text-primary);
  background: var(--bg-surface-active);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.nav-badge {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 1px 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
}

.nav-item.active .nav-badge {
  background: var(--accent-primary-subtle);
  color: var(--accent-primary);
}

/* Navbar Right Actions */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.endpoint-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.endpoint-chip:hover {
  border-color: var(--border-default);
}

.endpoint-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.endpoint-url {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--accent-primary);
}

/* ==========================================================================
   App Main & Views
   ========================================================================== */
.app-main {
  max-width: 1440px;
  margin: 0 auto;
  padding: 28px 24px 80px;
}

.tab-pane {
  display: none;
}

.tab-pane.active {
  display: block;
}

.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.view-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.view-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.view-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ==========================================================================
   Buttons
   ========================================================================== */
.btn-primary, .btn-secondary, .btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
  text-decoration: none;
  white-space: nowrap;
}

.btn-sm {
  padding: 7px 14px;
  font-size: 0.82rem;
}

.btn-xs {
  padding: 4px 8px;
  font-size: 0.72rem;
}

.btn-primary {
  background: var(--text-primary);
  color: #08090d;
  border: 1px solid transparent;
}

.btn-primary:hover {
  background: #ffffff;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.2);
}

.btn-secondary {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

.btn-secondary:hover {
  background: var(--bg-surface-hover);
  border-color: var(--border-strong);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid transparent;
}

.btn-ghost:hover {
  background: var(--bg-surface);
  color: var(--text-primary);
}

/* ==========================================================================
   Stats Grid
   ========================================================================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  padding: 18px 20px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.stat-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-tertiary);
  margin-bottom: 6px;
}

.stat-value {
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.stat-unit {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-tertiary);
}

.stat-sub {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-tertiary);
}

.stat-meta {
  font-size: 0.74rem;
  margin-top: 6px;
}

.text-success { color: var(--accent-emerald); }
.text-emerald { color: var(--accent-emerald); }
.text-muted { color: var(--text-tertiary); }
.text-secondary { color: var(--text-secondary); }
.text-sm { font-size: 0.8rem; }
.mb-3 { margin-bottom: 12px; }
.mt-1 { margin-top: 4px; }

/* ==========================================================================
   Content Panels & Cards
   ========================================================================== */
.content-panel {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 22px;
  margin-bottom: 24px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.panel-title {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.panel-subtitle {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* ==========================================================================
   Virtual Combos Grid
   ========================================================================== */
.combos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.combo-card {
  padding: 18px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.15s ease;
}

.combo-card:hover {
  border-color: var(--border-default);
}

.combo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.combo-name {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent-primary);
  background: var(--accent-primary-subtle);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}

.badge-neon {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 6px;
  background: var(--accent-emerald-subtle);
  color: var(--accent-emerald);
  border-radius: var(--radius-xs);
}

.combo-card h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.combo-card p {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.45;
  margin-bottom: 14px;
  flex: 1;
}

.combo-actions {
  display: flex;
  gap: 8px;
}

.btn-copy-sm, .btn-test-sm, .btn-delete-sm {
  padding: 4px 10px;
  font-size: 0.74rem;
  font-weight: 500;
  border-radius: var(--radius-xs);
  cursor: pointer;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  transition: all 0.15s ease;
}

.btn-copy-sm:hover, .btn-test-sm:hover {
  background: var(--bg-surface-active);
  color: var(--text-primary);
  border-color: var(--border-default);
}

.btn-delete-sm:hover {
  background: var(--accent-rose-subtle);
  color: var(--accent-rose);
  border-color: rgba(244, 63, 94, 0.3);
}

/* ==========================================================================
   Filter Toolbar & Providers Matrix
   ========================================================================== */
.filter-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.search-box-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px 0 36px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  border-color: var(--border-strong);
  background: var(--bg-surface);
}

.filter-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pill-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pill-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-default);
}

.pill-btn.active {
  background: var(--bg-surface-active);
  color: var(--text-primary);
  border-color: var(--border-strong);
  font-weight: 600;
}

/* Providers Matrix */
.providers-matrix {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.provider-card {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.provider-card:hover {
  border-color: var(--border-default);
  background: var(--bg-surface);
}

.provider-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.provider-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.provider-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.badge-cyan {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 6px;
  background: var(--accent-primary-subtle);
  color: var(--accent-primary);
  border-radius: var(--radius-xs);
}

.provider-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 12px;
}

.provider-models-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 16px;
}

.model-tag {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  padding: 2px 6px;
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
}

.provider-actions {
  display: flex;
  gap: 8px;
}

.btn-portal {
  flex: 1;
  padding: 6px 10px;
  font-size: 0.74rem;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  color: var(--text-secondary);
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  transition: all 0.15s ease;
}

.btn-portal:hover {
  color: var(--text-primary);
  border-color: var(--border-default);
}

.btn-add-key {
  flex: 1.2;
  padding: 6px 10px;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-primary);
  background: var(--bg-surface-active);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  transition: all 0.15s ease;
}

.btn-add-key:hover {
  background: #252b40;
  border-color: var(--border-strong);
}

/* Status Pills */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-online {
  background: var(--accent-emerald-subtle);
  color: var(--accent-emerald);
}

.status-zero {
  background: var(--accent-primary-subtle);
  color: var(--accent-primary);
}

.status-offline {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-tertiary);
}

/* ==========================================================================
   Data Tables
   ========================================================================== */
.table-container {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.82rem;
}

.data-table th {
  padding: 10px 14px;
  background: var(--bg-surface);
  color: var(--text-tertiary);
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border-subtle);
}

.data-table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.data-table tbody tr:hover {
  background: var(--bg-surface);
}

.data-table td strong {
  color: var(--text-primary);
}

.data-table code {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--accent-primary);
  background: var(--bg-app);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}

/* ==========================================================================
   Code Snippets & Display Boxes
   ========================================================================== */
.code-box-display {
  position: relative;
  background: #05060a;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 12px;
  margin-top: 10px;
}

.code-box-display pre, .code-box-display code {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: #c9d1d9;
  line-height: 1.55;
  overflow-x: auto;
}

.code-box-display button {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* ==========================================================================
   Playground Studio
   ========================================================================== */
.playground-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  min-height: 520px;
}

.playground-settings-card {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input, .form-select {
  height: 36px;
  padding: 0 10px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.82rem;
  outline: none;
}

.form-input:focus, .form-select:focus {
  border-color: var(--border-strong);
}

.range-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.form-range {
  accent-color: var(--accent-primary);
}

.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.playground-chat-card {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-messages-viewport {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 440px;
}

.message-row {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.message-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-row.assistant {
  align-self: flex-start;
}

.message-avatar {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-xs);
  background: var(--bg-surface-active);
  font-size: 0.68rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary);
  flex-shrink: 0;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  line-height: 1.5;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
}

.message-row.user .message-bubble {
  background: var(--bg-surface-active);
  border-color: var(--border-default);
  color: var(--text-primary);
}

.chat-input-toolbar {
  padding: 12px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  display: flex;
  gap: 8px;
}

.chat-textarea {
  flex: 1;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  resize: none;
  outline: none;
}

.chat-textarea:focus {
  border-color: var(--border-strong);
}

.btn-send {
  padding: 0 16px;
  height: 38px;
}

/* ==========================================================================
   Modals
   ========================================================================== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-backdrop.active {
  display: flex;
}

.modal-dialog {
  width: 100%;
  max-width: 460px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: 1.3rem;
  cursor: pointer;
  line-height: 1;
}

.btn-close:hover {
  color: var(--text-primary);
}

.portal-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 8px;
}

.link-accent {
  color: var(--accent-primary);
  text-decoration: none;
}

.link-accent:hover {
  text-decoration: underline;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

/* Toast Notifications */
.toast-viewport {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 2000;
}

.toast {
  padding: 10px 16px;
  background: var(--bg-surface-active);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.8rem;
  font-weight: 500;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast-success { border-left: 3px solid var(--accent-emerald); }
.toast-error { border-left: 3px solid var(--accent-rose); }
.toast-info { border-left: 3px solid var(--accent-primary); }

/* ==========================================================================
   Responsive Breakpoints
   ========================================================================== */
@media (max-width: 1024px) {
  .playground-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .navbar-inner {
    height: auto;
    padding: 12px 16px;
    flex-direction: column;
    align-items: stretch;
  }
  .nav-segmented-control {
    order: 3;
    overflow-x: auto;
  }
  .navbar-actions {
    justify-content: space-between;
  }
}
`;

fs.writeFileSync(path.join(rootDir, 'public', 'css', 'style.css'), cssContent, 'utf8');
console.log('Silicon Valley grade style.css created!');
