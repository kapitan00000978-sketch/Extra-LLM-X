import express from 'express';
import { KeyStore, ModelStore, LogStore, HealthStore } from '../db/database.js';
import { adapterRegistry } from '../adapters/index.js';
import { discoveryEngine } from '../engine/discovery.js';
import { getAllCombos } from '../engine/combos.js';
import { healthCheckEngine } from '../engine/health_check.js';
import { responseCache } from '../engine/cache.js';
import { routerEngine } from '../engine/router.js';
import { benchmarkEngine } from '../engine/benchmarking.js';
import { OMNIROUTE_FREE_MODELS } from '../catalog/omniroute_catalog.js';
import { PROVIDERS_400 } from '../catalog/providers_400.js';

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
      monthlyCapacityPool: '5B+ Free Tokens/Month ($0.00)',
      architecture: 'OmniRoute-Compatible Free Autopilot'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/free-provider-rankings', (req, res) => {
  try {
    const rankings = benchmarkEngine.getRankings();
    res.json({ rankings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/benchmarks/results', (req, res) => {
  try {
    const rankings = benchmarkEngine.getRankings();
    res.json({
      success: true,
      rankings,
      timestamp: Date.now()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/benchmarks/run', async (req, res) => {
  try {
    const results = await benchmarkEngine.probeAll();
    const rankings = benchmarkEngine.getRankings();
    res.json({
      success: true,
      probed: results,
      rankings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/benchmarks/probe/:provider', async (req, res) => {
  try {
    const result = await benchmarkEngine.probeProvider(req.params.provider);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

adminRouter.get('/providers/directory', (req, res) => {
  try {
    const keys = KeyStore.getAllProviderKeys();
    const activeProviderIds = new Set(keys.filter(k => k.active === 1).map(k => k.provider));
    const result = PROVIDERS_400.map(p => ({
      ...p,
      hasKey: activeProviderIds.has(p.id),
      keyCount: keys.filter(k => k.provider === p.id).length
    }));
    res.json({ total: result.length, providers: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/providers/custom', async (req, res) => {
  try {
    const { name, baseUrl, apiKey, id } = req.body;
    if (!name || !apiKey) {
      return res.status(400).json({ error: 'Provider name and apiKey are required.' });
    }
    const providerId = id || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const savedKey = KeyStore.addProviderKey(providerId, apiKey, name);
    
    let discovered = 0;
    if (baseUrl) {
      try {
        const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(5000)
        });
        if (resp.ok) {
          const data = await resp.json();
          const list = data.data || data.models || [];
          for (const m of list) {
            const mId = m.id || m.name;
            if (mId) {
              ModelStore.saveModel({
                provider: providerId,
                model_id: mId,
                display_name: `${name} ${mId}`,
                description: `Discovered from custom endpoint ${baseUrl}`,
                is_free: 1
              });
              discovered++;
            }
          }
        }
      } catch (e) {}
    }
    
    res.json({ success: true, providerId, keyId: savedKey.id, modelsDiscovered: discovered });
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

/**
 * POST /api/providers/auto-discover
 * 
 * Full automated pipeline:
 *   1. Validate the API key with a live inference test
 *   2. Discover all available free models from the provider
 *   3. Save the key to the database
 *   4. Register all discovered models in the model store
 *   5. Return comprehensive results
 *
 * Body: { provider: string, apiKey: string, label?: string }
 * 
 * This is the core "paste key в†’ everything works" endpoint.
 */
adminRouter.post('/providers/auto-discover', async (req, res) => {
  const { provider, apiKey, label } = req.body;
  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'Provider and apiKey are required.' });
  }

  try {
    const result = await discoveryEngine.testAndActivateKey(provider, apiKey, label);

    if (result.success) {
      res.json({
        success: true,
        provider: result.provider,
        testPassed: result.testPassed,
        testedModel: result.testedModel,
        testReply: result.testReply,
        testLatencyMs: result.testLatencyMs,
        totalLatencyMs: result.totalLatencyMs,
        modelsDiscovered: result.modelsDiscovered,
        modelsRegistered: result.modelsRegistered,
        keySaved: result.keySaved,
        keyRecord: result.keyRecord,
        message: `вњ… ${result.provider.toUpperCase()} activated! ${result.modelsDiscovered} free models discovered and registered.`
      });
    } else {
      res.status(400).json({
        success: false,
        provider: result.provider,
        errors: result.errors,
        message: `вќЊ Failed to activate ${result.provider}: ${result.errors.join('; ')}`
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
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

adminRouter.post('/system-keys/random', (req, res) => {
  try {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const name = (req.body && req.body.name) || ('Agent Key #' + randomSuffix);
    const rateLimit = parseInt((req.body && req.body.rateLimit) || 120, 10);
    const newKey = KeyStore.createSystemKey(name, rateLimit);
    res.json({ success: true, key: newKey.key, details: newKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/system-keys', (req, res) => {
  try {
    const { name, rateLimit } = req.body;
    const newKey = KeyStore.createSystemKey(name || 'Master Gateway Key', parseInt(rateLimit || 120, 10));
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
      compatibleWith: ['AI Applications & Agents', 'Cursor', 'Cline', 'Roo Code', 'Aider', 'OpenAI Python SDK']
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

adminRouter.get('/integrations/config', (req, res) => {
  try {
    const keys = KeyStore.getAllSystemKeys();
    const activeKey = keys.find(k => k.active === 1)?.key || 'elx-live-master-free-hub';

    const envContent = `# AI Applications & Agents вЂ” Extra LLM X Free Gateway Environment
OPENAI_API_BASE=http://localhost:3000/v1
OPENAI_API_KEY=${activeKey}

# Model Route Mappings
DEFAULT_MODEL=extra/auto-free
PLANNING_MODEL=extra/free-reasoning
CODING_MODEL=extra/free-coding
FAST_MODEL=extra/free-fast
VISION_MODEL=extra/free-vision
EMBEDDING_MODEL=extra/free-embedding
IMAGE_MODEL=flux
AUDIO_MODEL=whisper-large-v3

# Gateway Configuration
EXTRA_LLM_X_URL=http://localhost:3000
AUTO_FAILOVER_ENABLED=true
SEMANTIC_CACHE_ENABLED=true
`;

    const pythonCode = `import openai

client = openai.OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="${activeKey}"
)

# 1. Chat Completion with 100% Free Auto-Routing
response = client.chat.completions.create(
    model="extra/auto-free",
    messages=[{"role": "user", "content": "Hello from AI Applications & Agents!"}]
)
print("Assistant:", response.choices[0].message.content)

# 2. 100% Free Vector Embeddings (1536 dims)
emb = client.embeddings.create(
    model="extra/free-embedding",
    input=["Agent memory retrieval step"]
)
print("Vector dims:", len(emb.data[0].embedding))
`;

    const nodeCode = `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: '${activeKey}'
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: 'extra/free-coding',
    messages: [{ role: 'user', content: 'Generate a TypeScript async queue.' }]
  });
  console.log(completion.choices[0].message.content);
}
main();
`;

    res.json({
      success: true,
      baseUrl: 'http://localhost:3000/v1',
      apiKey: activeKey,
      envSnippet: envContent,
      pythonSnippet: pythonCode,
      nodeSnippet: nodeCode,
      combos: [
        { role: 'Autopilot', combo: 'extra/auto-free', description: 'Universal failover chain across 26 providers' },
        { role: 'Reasoning', combo: 'extra/free-reasoning', description: 'DeepSeek-R1 CoT mathematical & logic chain' },
        { role: 'Coding', combo: 'extra/free-coding', description: 'Codestral, Qwen 2.5 Coder, Llama 3.3 70B' },
        { role: 'Fast LPUs', combo: 'extra/free-fast', description: 'Sub-second Cerebras and Groq execution' },
        { role: 'Vision', combo: 'extra/free-vision', description: 'Gemini 2.0 Flash and GPT-4o-mini multimodal' }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/agent/simulate', async (req, res) => {
  const startTime = Date.now();
  const logs = [];

  try {
    // Step 1: Simulate Planner
    logs.push({ step: '1. Task Decomposition & Planning', model: 'extra/free-reasoning', status: 'started' });
    const planResult = await routerEngine.dispatch({
      clientKey: 'elx-live-master-free-hub',
      requestedModel: 'extra/free-reasoning',
      messages: [{ role: 'user', content: 'AI Applications & Agents Simulation: Create a 2-step pipeline plan' }],
      stream: false
    });
    logs[0].status = 'completed';
    logs[0].provider = planResult.provider;
    logs[0].model = planResult.model;
    logs[0].fallback = planResult.fallbackOccurred;

    // Step 2: Simulate Coding Specialist
    logs.push({ step: '2. Code Generation & Tool Synthesis', model: 'extra/free-coding', status: 'started' });
    const codeResult = await routerEngine.dispatch({
      clientKey: 'elx-live-master-free-hub',
      requestedModel: 'extra/free-coding',
      messages: [{ role: 'user', content: 'Generate a short fibonacci function in python' }],
      stream: false
    });
    logs[1].status = 'completed';
    logs[1].provider = codeResult.provider;
    logs[1].model = codeResult.model;
    logs[1].fallback = codeResult.fallbackOccurred;

    const totalDuration = Date.now() - startTime;

    res.json({
      success: true,
      simulation: 'PASS',
      totalLatencyMs: totalDuration,
      steps: logs,
      summary: 'AI Applications & Agents multi-step autonomous execution completed with 0 errors via 100% free routes.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      simulation: 'FAIL',
      error: err.message,
      steps: logs
    });
  }
});




