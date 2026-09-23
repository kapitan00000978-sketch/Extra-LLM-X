import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config.js';

// Ensure data directory exists
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

export const db = new DatabaseSync(config.dbPath);

// Initialize database schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS provider_keys (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      api_key TEXT NOT NULL,
      label TEXT,
      active INTEGER DEFAULT 1,
      error_count INTEGER DEFAULT 0,
      cooldown_until INTEGER DEFAULT 0,
      created_at INTEGER,
      last_used_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS system_api_keys (
      key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      rate_limit_rpm INTEGER DEFAULT 60,
      request_count INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      created_at INTEGER,
      last_used_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS cached_models (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      model_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      context_window INTEGER DEFAULT 8192,
      is_free INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      capabilities TEXT DEFAULT 'chat',
      latency_ms INTEGER DEFAULT 0,
      last_scanned INTEGER
    );

    CREATE TABLE IF NOT EXISTS request_logs (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      client_key TEXT,
      requested_model TEXT,
      actual_model TEXT,
      provider TEXT,
      prompt_tokens INTEGER DEFAULT 0,
      completion_tokens INTEGER DEFAULT 0,
      latency_ms INTEGER DEFAULT 0,
      status_code INTEGER DEFAULT 200,
      fallback_occurred INTEGER DEFAULT 0,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Ensure default ExtraLLMX Key exists so user can use it right away!
  const existingKey = db.prepare('SELECT key FROM system_api_keys LIMIT 1').get();
  if (!existingKey) {
    const defaultKey = 'elx-live-universal-agent-free-hub';
    const stmt = db.prepare(`
      INSERT INTO system_api_keys (key, name, active, rate_limit_rpm, request_count, total_tokens, created_at, last_used_at)
      VALUES (?, ?, 1, 120, 0, 0, ?, ?)
    `);
    const now = Date.now();
    stmt.run(defaultKey, 'Default Universal Agent Key', now, now);
    console.log(`[DB] Created default client API Key: ${defaultKey}`);
  }
}

// Key Management Helpers
export const KeyStore = {
  // System client API keys
  getAllSystemKeys() {
    return db.prepare('SELECT * FROM system_api_keys ORDER BY created_at DESC').all();
  },
  
  createSystemKey(name = 'New Agent Key', rateLimit = 100) {
    const raw = crypto.randomBytes(16).toString('hex');
    const key = `elx-live-${raw}`;
    const now = Date.now();
    db.prepare(`
      INSERT INTO system_api_keys (key, name, active, rate_limit_rpm, request_count, total_tokens, created_at, last_used_at)
      VALUES (?, ?, 1, ?, 0, 0, ?, ?)
    `).run(key, name, rateLimit, now, now);
    return { key, name, active: 1, rate_limit_rpm: rateLimit };
  },

  verifySystemKey(key) {
    if (!key) return null;
    if (key === config.masterKey) {
      return { key: config.masterKey, name: 'Master Admin Key', active: 1, isMaster: true };
    }
    const cleanKey = key.replace(/^Bearer\s+/i, '').trim();
    const row = db.prepare('SELECT * FROM system_api_keys WHERE key = ? AND active = 1').get(cleanKey);
    return row || null;
  },

  deleteSystemKey(key) {
    return db.prepare('DELETE FROM system_api_keys WHERE key = ?').run(key);
  },

  toggleSystemKey(key, active) {
    return db.prepare('UPDATE system_api_keys SET active = ? WHERE key = ?').run(active ? 1 : 0, key);
  },

  recordKeyUsage(key, tokens = 0) {
    if (!key) return;
    const cleanKey = key.replace(/^Bearer\s+/i, '').trim();
    db.prepare(`
      UPDATE system_api_keys 
      SET request_count = request_count + 1, total_tokens = total_tokens + ?, last_used_at = ?
      WHERE key = ?
    `).run(tokens, Date.now(), cleanKey);
  },

  // External Provider Keys
  getAllProviderKeys() {
    return db.prepare('SELECT id, provider, api_key, label, active, error_count, cooldown_until, created_at, last_used_at FROM provider_keys ORDER BY provider, created_at DESC').all();
  },

  getAvailableProviderKey(providerName) {
    const now = Date.now();
    // Select active keys where cooldown has expired, order by least recently used
    const keys = db.prepare(`
      SELECT * FROM provider_keys 
      WHERE provider = ? AND active = 1 AND (cooldown_until IS NULL OR cooldown_until < ?)
      ORDER BY last_used_at ASC, error_count ASC
    `).all(providerName, now);

    if (!keys || keys.length === 0) return null;
    return keys[0];
  },

  addProviderKey(provider, apiKey, label = '') {
    const id = crypto.randomUUID();
    const now = Date.now();
    db.prepare(`
      INSERT INTO provider_keys (id, provider, api_key, label, active, error_count, cooldown_until, created_at, last_used_at)
      VALUES (?, ?, ?, ?, 1, 0, 0, ?, ?)
    `).run(id, provider.toLowerCase().trim(), apiKey.trim(), label, now, 0);
    return { id, provider, active: 1, label };
  },

  deleteProviderKey(id) {
    return db.prepare('DELETE FROM provider_keys WHERE id = ?').run(id);
  },

  toggleProviderKey(id, active) {
    return db.prepare('UPDATE provider_keys SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
  },

  markKeyCooldown(id, cooldownSeconds = 60) {
    const until = Date.now() + (cooldownSeconds * 1000);
    db.prepare(`
      UPDATE provider_keys 
      SET error_count = error_count + 1, cooldown_until = ?
      WHERE id = ?
    `).run(until, id);
  },

  touchProviderKey(id) {
    db.prepare('UPDATE provider_keys SET last_used_at = ?, error_count = 0 WHERE id = ?').run(Date.now(), id);
  }
};

// Model Store Helpers
export const ModelStore = {
  getAllModels() {
    return db.prepare('SELECT * FROM cached_models WHERE is_active = 1 ORDER BY provider, display_name').all();
  },

  getFreeModels() {
    return db.prepare('SELECT * FROM cached_models WHERE is_active = 1 AND is_free = 1 ORDER BY provider, display_name').all();
  },

  getModelById(id) {
    return db.prepare('SELECT * FROM cached_models WHERE id = ?').get(id);
  },

  upsertModel(model) {
    db.prepare(`
      INSERT INTO cached_models (id, provider, model_id, display_name, description, context_window, is_free, is_active, capabilities, latency_ms, last_scanned)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        display_name = excluded.display_name,
        description = excluded.description,
        context_window = excluded.context_window,
        is_free = excluded.is_free,
        capabilities = excluded.capabilities,
        latency_ms = excluded.latency_ms,
        last_scanned = excluded.last_scanned
    `).run(
      model.id,
      model.provider,
      model.model_id,
      model.display_name,
      model.description || '',
      model.context_window || 8192,
      model.is_free ? 1 : 0,
      model.capabilities || 'chat',
      model.latency_ms || 0,
      Date.now()
    );
  },

  deleteProviderModels(provider) {
    return db.prepare('DELETE FROM cached_models WHERE provider = ?').run(provider);
  }
};

// Request Logging & Telemetry
export const LogStore = {
  record({
    clientKey,
    requestedModel,
    actualModel,
    provider,
    promptTokens = 0,
    completionTokens = 0,
    latencyMs = 0,
    statusCode = 200,
    fallbackOccurred = false,
    errorMessage = null
  }) {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO request_logs (id, timestamp, client_key, requested_model, actual_model, provider, prompt_tokens, completion_tokens, latency_ms, status_code, fallback_occurred, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      Date.now(),
      clientKey ? clientKey.slice(0, 16) + '...' : 'anonymous',
      requestedModel,
      actualModel,
      provider,
      promptTokens,
      completionTokens,
      latencyMs,
      statusCode,
      fallbackOccurred ? 1 : 0,
      errorMessage
    );
  },

  getRecentLogs(limit = 100) {
    return db.prepare('SELECT * FROM request_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
  },

  getStats() {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(prompt_tokens) as total_prompt_tokens,
        SUM(completion_tokens) as total_completion_tokens,
        AVG(latency_ms) as avg_latency,
        SUM(CASE WHEN status_code = 200 THEN 1 ELSE 0 END) as successful_requests,
        SUM(CASE WHEN fallback_occurred = 1 THEN 1 ELSE 0 END) as total_fallbacks
      FROM request_logs
    `).get();

    const totalTokens = (stats.total_prompt_tokens || 0) + (stats.total_completion_tokens || 0);
    // Estimated USD savings assuming standard commercial API costs (~$5 per 1M tokens avg)
    const estimatedSavedUsd = ((totalTokens / 1000000) * 5.0).toFixed(4);

    return {
      totalRequests: stats.total_requests || 0,
      successfulRequests: stats.successful_requests || 0,
      totalTokens,
      avgLatencyMs: Math.round(stats.avg_latency || 0),
      totalFallbacks: stats.total_fallbacks || 0,
      estimatedSavedUsd,
      activeModelsCount: (db.prepare('SELECT COUNT(*) as c FROM cached_models WHERE is_active = 1 AND is_free = 1').get()).c,
      activeKeysCount: (db.prepare('SELECT COUNT(*) as c FROM provider_keys WHERE active = 1').get()).c
    };
  }
};
