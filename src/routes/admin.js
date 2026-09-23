import express from 'express';
import { KeyStore, ModelStore, LogStore } from '../db/database.js';
import { registry, ProviderPortals } from '../providers/registry.js';
import { getAllCombos } from '../router/combos.js';
import { dispatcher } from '../router/dispatcher.js';

export const adminRouter = express.Router();

/**
 * GET /api/stats
 * Telemetry and savings calculator
 */
adminRouter.get('/stats', (req, res) => {
  try {
    const stats = LogStore.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/providers/portals
 * List available provider portals with links to get free keys
 */
adminRouter.get('/providers/portals', (req, res) => {
  const keys = KeyStore.getAllProviderKeys();
  const portals = ProviderPortals.map(p => {
    const providerKeys = keys.filter(k => k.provider === p.id);
    const activeKeys = providerKeys.filter(k => k.active === 1);
    return {
      ...p,
      configuredKeysCount: providerKeys.length,
      activeKeysCount: activeKeys.length,
      status: p.id === 'ollama' ? 'ready' : (activeKeys.length > 0 ? 'active' : 'unconfigured')
    };
  });
  res.json(portals);
});

/**
 * GET /api/providers/keys
 * Return all configured provider keys (masked for privacy)
 */
adminRouter.get('/providers/keys', (req, res) => {
  try {
    const keys = KeyStore.getAllProviderKeys();
    const masked = keys.map(k => ({
      ...k,
      api_key_masked: k.api_key.length > 8 
        ? `${k.api_key.slice(0, 4)}...${k.api_key.slice(-4)}`
        : '****'
    }));
    res.json(masked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/providers/keys
 * Add a new API key for a provider
 */
adminRouter.post('/providers/keys', (req, res) => {
  const { provider, apiKey, label } = req.body;
  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'Provider and apiKey are required.' });
  }

  try {
    const newRecord = KeyStore.addProviderKey(provider, apiKey, label || `${provider} Key`);
    // Trigger model scan in background for this provider
    const prov = registry.get(provider.toLowerCase());
    if (prov) {
      prov.scanModels(apiKey).then(models => {
        if (models && models.length > 0) {
          models.forEach(m => ModelStore.upsertModel(m));
        }
      }).catch(() => {});
    }

    res.json({ success: true, key: newRecord });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/providers/keys/:id
 * Remove a provider key
 */
adminRouter.delete('/providers/keys/:id', (req, res) => {
  try {
    KeyStore.deleteProviderKey(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/providers/keys/:id/toggle
 * Toggle active status
 */
adminRouter.post('/providers/keys/:id/toggle', (req, res) => {
  try {
    const { active } = req.body;
    KeyStore.toggleProviderKey(req.params.id, active);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/providers/test
 * Test an individual provider key immediately
 */
adminRouter.post('/providers/test', async (req, res) => {
  const { provider, apiKey } = req.body;
  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'Provider and apiKey are required.' });
  }

  const prov = registry.get(provider.toLowerCase());
  if (!prov) {
    return res.status(400).json({ error: `Unknown provider: ${provider}` });
  }

  const startTime = Date.now();
  try {
    const testModels = await prov.scanModels(apiKey);
    if (!testModels || testModels.length === 0) {
      return res.status(400).json({ error: 'No models found for this provider.' });
    }

    const firstModel = testModels[0].model_id;
    const testRes = await prov.complete({
      apiKey,
      model: firstModel,
      messages: [{ role: 'user', content: 'Say "Extra LLM X Free Test OK" in 5 words.' }],
      max_tokens: 20
    });

    const data = await testRes.json();
    const reply = data.choices?.[0]?.message?.content || 'Connection OK';
    const latencyMs = Date.now() - startTime;

    res.json({
      success: true,
      provider,
      testedModel: firstModel,
      latencyMs,
      reply
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
      latencyMs: Date.now() - startTime
    });
  }
});

/**
 * GET /api/models
 * List all discovered 100% free models + combos
 */
adminRouter.get('/models', (req, res) => {
  try {
    const combos = getAllCombos();
    const freeModels = ModelStore.getFreeModels();
    res.json({
      combos,
      models: freeModels,
      totalFreeModels: freeModels.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/models/scan
 * Force refresh and discover all free models across all providers
 */
adminRouter.post('/models/scan', async (req, res) => {
  try {
    const count = await registry.scanAllProviders();
    const freeModels = ModelStore.getFreeModels();
    res.json({
      success: true,
      scannedCount: count,
      totalActiveFreeModels: freeModels.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/models/test
 * Test prompt execution against any model or combo
 */
adminRouter.post('/models/test', async (req, res) => {
  const { model, prompt = 'Explain quantum computing in one sentence.' } = req.body;
  const startTime = Date.now();

  try {
    const result = await dispatcher.dispatch({
      clientKey: 'dashboard-test',
      requestedModel: model || 'extra/auto-free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100
    });

    const data = await result.response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    const latencyMs = Date.now() - startTime;

    res.json({
      success: true,
      reply,
      provider: result.provider,
      actualModel: result.model,
      fallbackOccurred: result.fallbackOccurred,
      latencyMs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      latencyMs: Date.now() - startTime
    });
  }
});

/**
 * GET /api/system-keys
 * List generated Extra LLM X client API keys
 */
adminRouter.get('/system-keys', (req, res) => {
  try {
    const keys = KeyStore.getAllSystemKeys();
    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/system-keys
 * Generate a new Extra LLM X API Key
 */
adminRouter.post('/system-keys', (req, res) => {
  try {
    const { name, rateLimit } = req.body;
    const newKey = KeyStore.createSystemKey(name || 'Universal Agent Key', parseInt(rateLimit || 120, 10));
    res.json({ success: true, key: newKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/system-keys/:key
 * Revoke an API Key
 */
adminRouter.delete('/system-keys/:key', (req, res) => {
  try {
    KeyStore.deleteSystemKey(req.params.key);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/system-keys/:key/toggle
 * Toggle active state
 */
adminRouter.post('/system-keys/:key/toggle', (req, res) => {
  try {
    const { active } = req.body;
    KeyStore.toggleSystemKey(req.params.key, active);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/logs
 * Telemetry log feed
 */
adminRouter.get('/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const logs = LogStore.getRecentLogs(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
