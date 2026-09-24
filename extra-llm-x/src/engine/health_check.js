import { adapterRegistry } from '../adapters/index.js';
import { KeyStore, HealthStore } from '../db/database.js';

export class HealthCheckEngine {
  constructor() {
    this.timer = null;
  }

  async checkProvider(providerId) {
    const adapter = adapterRegistry.get(providerId);
    if (!adapter) {
      return { provider: providerId, status: 'unknown', latency_ms: 0, error: 'Unknown provider' };
    }

    const startTime = Date.now();

    // 1. Mock adapter
    if (providerId === 'mock') {
      const latency = 5;
      HealthStore.upsertHealth(providerId, 'healthy', latency, null);
      return { provider: providerId, status: 'healthy', latency_ms: latency };
    }

    // 2. Localhost adapters (Ollama, LM Studio)
    if (providerId === 'ollama') {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch('http://127.0.0.1:11434/api/tags', { signal: controller.signal });
        clearTimeout(timeout);
        const latency = Date.now() - startTime;
        const status = res.ok ? 'healthy' : 'degraded';
        HealthStore.upsertHealth(providerId, status, latency, res.ok ? null : `HTTP ${res.status}`);
        return { provider: providerId, status, latency_ms: latency };
      } catch (err) {
        HealthStore.upsertHealth(providerId, 'offline', 0, 'Local Ollama not running on :11434');
        return { provider: providerId, status: 'offline', latency_ms: 0, error: 'Not running' };
      }
    }

    if (providerId === 'lmstudio') {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch('http://127.0.0.1:1234/v1/models', { signal: controller.signal });
        clearTimeout(timeout);
        const latency = Date.now() - startTime;
        const status = res.ok ? 'healthy' : 'degraded';
        HealthStore.upsertHealth(providerId, status, latency, res.ok ? null : `HTTP ${res.status}`);
        return { provider: providerId, status, latency_ms: latency };
      } catch (err) {
        HealthStore.upsertHealth(providerId, 'offline', 0, 'LM Studio not running on :1234');
        return { provider: providerId, status: 'offline', latency_ms: 0, error: 'Not running' };
      }
    }

    // 3. Zero-Key NoAuth Public Providers (Pollinations, OpenCode)
    if (adapter.isNoAuth) {
      try {
        await adapter.discoverModels();
        const latency = Date.now() - startTime;
        HealthStore.upsertHealth(providerId, 'healthy', latency, null);
        return { provider: providerId, status: 'healthy', latency_ms: latency };
      } catch (err) {
        const latency = Date.now() - startTime;
        HealthStore.upsertHealth(providerId, 'degraded', latency, err.message);
        return { provider: providerId, status: 'degraded', latency_ms: latency, error: err.message };
      }
    }

    // 4. Cloud Provider with Key
    const keyRecord = KeyStore.getAvailableProviderKey(providerId);
    if (!keyRecord) {
      HealthStore.upsertHealth(providerId, 'unconfigured', 0, 'No active API key');
      return { provider: providerId, status: 'unconfigured', latency_ms: 0 };
    }

    try {
      // Run quick discover or probe
      await adapter.discoverModels(keyRecord.api_key);
      const latency = Date.now() - startTime;
      HealthStore.upsertHealth(providerId, 'healthy', latency, null);
      return { provider: providerId, status: 'healthy', latency_ms: latency };
    } catch (err) {
      const latency = Date.now() - startTime;
      const status = err.status || 500;
      const { isRateLimit, isAuth } = adapter.classifyError(err, status);

      let healthStatus = 'offline';
      if (isRateLimit) healthStatus = 'degraded';
      else if (isAuth) healthStatus = 'auth_failed';

      HealthStore.upsertHealth(providerId, healthStatus, latency, err.message);
      return { provider: providerId, status: healthStatus, latency_ms: latency, error: err.message };
    }
  }

  async checkAll() {
    const adapters = adapterRegistry.getAll();
    const results = await Promise.allSettled(
      adapters.map(a => this.checkProvider(a.id))
    );

    return results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return { provider: adapters[i].id, status: 'error', latency_ms: 0, error: r.reason?.message };
    });
  }

  startPeriodic(intervalMs = 600000) {
    if (this.timer) clearInterval(this.timer);
    // Initial check after short delay
    setTimeout(() => {
      this.checkAll().catch(e => console.error('[HealthCheck] Periodic error:', e));
    }, 5000);

    this.timer = setInterval(() => {
      this.checkAll().catch(e => console.error('[HealthCheck] Periodic error:', e));
    }, intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const healthCheckEngine = new HealthCheckEngine();
