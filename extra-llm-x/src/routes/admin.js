import express from 'express';
import { KeyStore, ModelStore, LogStore, HealthStore } from '../db/database.js';
import { adapterRegistry } from '../adapters/index.js';
import { discoveryEngine } from '../engine/discovery.js';
import { getAllCombos } from '../engine/combos.js';
import { healthCheckEngine } from '../engine/health_check.js';

export const adminRouter = express.Router();

adminRouter.get('/stats', (req, res) => {
  try {
    const stats = LogStore.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/analytics/charts', (req, res) => {
  try {
    const timeSeries = LogStore.getTimeSeries();
    const distribution = LogStore.getProviderDistribution();
    res.json({ timeSeries, distribution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/health-check/status', (req, res) => {
  try {
    const health = HealthStore.getAllHealth();
    res.json(health);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/health-check/run', async (req, res) => {
  try {
    const results = await healthCheckEngine.checkAll();
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/health-check/provider/:id', async (req, res) => {
  try {
    const result = await healthCheckEngine.checkProvider(req.params.id);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/providers/portals', (req, res) => {
  try {
    const portals = adapterRegistry.getPortals();
    res.json(portals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

adminRouter.post('/providers/keys', async (req, res) => {
  const { provider, apiKey, label } = req.body;
  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'Provider and apiKey are required.' });
  }

  try {
    const newRecord = KeyStore.addProviderKey(provider, apiKey, label || `${provider} Key`);
    // Scan in background
    discoveryEngine.scanProvider(provider).catch(() => {});
    res.json({ success: true, key: newRecord });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.delete('/providers/keys/:id', (req, res) => {
  try {
    KeyStore.deleteProviderKey(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/providers/keys/:id/toggle', (req, res) => {
  try {
    const { active } = req.body;
    KeyStore.toggleProviderKey(req.params.id, active);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/providers/test', async (req, res) => {
  const { provider, apiKey } = req.body;
  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'Provider and apiKey are required.' });
  }

  const adapter = adapterRegistry.get(provider.toLowerCase());
  if (!adapter) {
    return res.status(400).json({ error: `Unknown provider: ${provider}` });
  }

  const startTime = Date.now();
  try {
    const models = await adapter.discoverModels(apiKey);
    if (!models || models.length === 0) {
      return res.status(400).json({ error: 'No models found for this provider.' });
    }

    const testModel = models[0].model_id;
    const testRes = await adapter.executeChat({
      apiKey,
      model: testModel,
      messages: [{ role: 'user', content: 'Say "Extra LLM X OK" in 5 words.' }],
      max_tokens: 20
    });

    const data = await testRes.json();
    const reply = data.choices?.[0]?.message?.content || 'Connection OK';
    const latencyMs = Date.now() - startTime;

    res.json({
      success: true,
      provider,
      testedModel: testModel,
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

adminRouter.post('/models/scan', async (req, res) => {
  try {
    const count = await discoveryEngine.scanAll();
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

adminRouter.get('/system-keys', (req, res) => {
  try {
    const keys = KeyStore.getAllSystemKeys();
    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/system-keys', (req, res) => {
  try {
    const { name, rateLimit } = req.body;
    const newKey = KeyStore.createSystemKey(name || 'Universal Agent Key', parseInt(rateLimit || 120, 10));
    res.json({ success: true, key: newKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.delete('/system-keys/:key', (req, res) => {
  try {
    KeyStore.deleteSystemKey(req.params.key);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const logs = LogStore.getRecentLogs(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
