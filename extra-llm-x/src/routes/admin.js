import express from 'express';
import { KeyStore, ModelStore, LogStore, HealthStore } from '../db/database.js';
import { adapterRegistry } from '../adapters/index.js';
import { discoveryEngine } from '../engine/discovery.js';
import { getAllCombos } from '../engine/combos.js';
import { healthCheckEngine } from '../engine/health_check.js';
import { responseCache } from '../engine/cache.js';
import { OMNIROUTE_FREE_MODELS } from '../catalog/omniroute_catalog.js';

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

// OmniRoute Compatible Free Endpoints
adminRouter.get('/free-models', (req, res) => {
  try {
    const freeModels = ModelStore.getFreeModels();
    res.json({
      totalCurated: OMNIROUTE_FREE_MODELS.length,
      activeFreeModels: freeModels.length,
      models: freeModels.map(m => ({
        provider: m.provider,
        modelId: m.model_id,
        displayName: m.display_name,
        contextWindow: m.context_window,
        capabilities: m.capabilities,
        isFree: true
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/free-tier/summary', (req, res) => {
  try {
    const freeModels = ModelStore.getFreeModels();
    const portals = adapterRegistry.getPortals();
    const readyPortals = portals.filter(p => p.status === 'ready' || p.status === 'active');
    res.json({
      totalCuratedFreeModels: OMNIROUTE_FREE_MODELS.length,
      activeFreeModels: freeModels.length,
      totalFreeProviders: portals.length,
      activeProviders: readyPortals.length,
      zeroKeyProviders: portals.filter(p => p.isNoAuth).length,
      monthlyCapacityPool: '1.5B+ Free Tokens/Month ($0.00)',
      architecture: 'OmniRoute-Compatible Free Autopilot'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/free-provider-rankings', (req, res) => {
  const rankings = [
    { rank: 1, id: 'deepseek', name: 'DeepSeek Official', eloScore: 1380, benchmarkScore: 1380, topModel: 'deepseek-reasoner (R1)', topFreeModels: ['deepseek-reasoner', 'deepseek-chat'], specialty: 'Math & Architecture Reasoning', speed: '50 tok/s', speedTokPerSec: 50, quota: '5M Free Tokens', freeQuota: '5M Free Tokens', category: 'Frontier Reasoning', isConfigured: true },
    { rank: 2, id: 'cerebras', name: 'Cerebras Cloud', eloScore: 1320, benchmarkScore: 1320, topModel: 'llama-3.3-70b', topFreeModels: ['llama-3.3-70b', 'llama3.1-8b'], specialty: 'Ultra-Low Latency Agent Loops', speed: '2,150 tok/s', speedTokPerSec: 2150, quota: '1M tokens/day', freeQuota: '1M tokens/day', category: 'High-Throughput Wafer', isConfigured: true },
    { rank: 3, id: 'groq', name: 'Groq Cloud', eloScore: 1315, benchmarkScore: 1315, topModel: 'llama-3.3-70b-versatile', topFreeModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'], specialty: 'Fast General & Coding', speed: '580 tok/s', speedTokPerSec: 580, quota: '14,400 req/day', freeQuota: '14,400 req/day', category: 'LPU Cloud', isConfigured: true },
    { rank: 4, id: 'gemini', name: 'Google AI Studio', eloScore: 1340, benchmarkScore: 1340, topModel: 'gemini-2.0-flash', topFreeModels: ['gemini-2.0-flash', 'gemini-1.5-flash'], specialty: 'Multimodal Vision & 1M Context', speed: '180 tok/s', speedTokPerSec: 180, quota: '1,500 req/day', freeQuota: '1,500 req/day', category: 'Multimodal', isConfigured: true },
    { rank: 5, id: 'sambanova', name: 'SambaNova Cloud', eloScore: 1360, benchmarkScore: 1360, topModel: 'DeepSeek-R1', topFreeModels: ['DeepSeek-R1', 'Qwen2.5-Coder-32B'], specialty: 'High-Precision Reasoning & Code', speed: '320 tok/s', speedTokPerSec: 320, quota: 'Daily Free Tier', freeQuota: 'Daily Free Tier', category: 'DataScale SN40L', isConfigured: true },
    { rank: 6, id: 'github', name: 'GitHub Models', eloScore: 1335, benchmarkScore: 1335, topModel: 'gpt-4o', topFreeModels: ['gpt-4o', 'gpt-4o-mini'], specialty: 'OpenAI GPT-4o Quality', speed: '90 tok/s', speedTokPerSec: 90, quota: '150 req/day (PAT)', freeQuota: '150 req/day (PAT)', category: 'Enterprise Azure', isConfigured: true },
    { rank: 7, id: 'opencode', name: 'OpenCode Free', eloScore: 1310, benchmarkScore: 1310, topModel: 'deepseek-v3', topFreeModels: ['deepseek-v3', 'qwen-2.5-72b'], specialty: 'Zero-Key Public Endpoint', speed: '110 tok/s', speedTokPerSec: 110, quota: 'Public Free Endpoint', freeQuota: 'Public Free Endpoint', category: 'NoAuth Public', isNoAuth: true },
    { rank: 8, id: 'mistral', name: 'Mistral AI', eloScore: 1300, benchmarkScore: 1300, topModel: 'codestral-latest', topFreeModels: ['codestral-latest', 'mistral-small-latest'], specialty: 'Polyglot Code Generation', speed: '120 tok/s', speedTokPerSec: 120, quota: 'Developer Tier', freeQuota: 'Developer Tier', category: 'Code Specialist', isConfigured: true },
    { rank: 9, id: 'zhipu', name: 'Zhipu GLM-4', eloScore: 1290, benchmarkScore: 1290, topModel: 'glm-4-flash', topFreeModels: ['glm-4-flash', 'glm-4v'], specialty: 'Fast Bilingual Chat & Code', speed: '240 tok/s', speedTokPerSec: 240, quota: '100% Free Forever', freeQuota: '100% Free Forever', category: 'Permanent Free Tier', isConfigured: true },
    { rank: 10, id: 'pollinations', name: 'Pollinations AI', eloScore: 1280, benchmarkScore: 1280, topModel: 'openai (GPT-4o-mini)', topFreeModels: ['openai', 'qwen', 'deepseek'], specialty: 'Zero-Key Public Endpoint', speed: '95 tok/s', speedTokPerSec: 95, quota: 'Public Free Endpoint', freeQuota: 'Public Free Endpoint', category: 'NoAuth Public', isNoAuth: true }
  ];
  res.json({ rankings });
});

adminRouter.get('/combos', (req, res) => {
  try {
    res.json({ combos: getAllCombos() });
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

adminRouter.post('/logs/clear', (req, res) => {
  try {
    LogStore.clearLogs();
    res.json({ success: true, message: 'Telemetry logs cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/logs/export', (req, res) => {
  try {
    const logs = LogStore.getRecentLogs(1000);
    res.setHeader('Content-Disposition', 'attachment; filename="extra-llm-x-telemetry.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(logs, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/handshake', (req, res) => {
  try {
    const freeModels = ModelStore.getFreeModels();
    const systemKeys = KeyStore.getAllSystemKeys();
    res.json({
      success: true,
      status: 'ready',
      endpoint: 'http://localhost:3000/v1',
      activeFreeModels: freeModels.length,
      clientKeysActive: systemKeys.filter(k => k.active === 1).length,
      ping: 'pong',
      latencyMs: 1,
      compatibleWith: ['Universal Agent HP', 'Cursor', 'Cline', 'Roo Code', 'Aider', 'OpenAI Python SDK']
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/cache/stats', (req, res) => {
  try {
    const stats = responseCache.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/cache/clear', (req, res) => {
  try {
    responseCache.clear();
    res.json({ success: true, message: 'Response cache purged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

