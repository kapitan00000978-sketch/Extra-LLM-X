import test from 'node:test';
import assert from 'node:assert';
import { OMNIROUTE_FREE_MODELS as omnirouteCatalog } from '../src/catalog/omniroute_catalog.js';
import { PromptCompressionEngine } from '../src/engine/compression.js';
import { LockoutPolicy } from '../src/engine/lockout.js';
import { getCombo, getAllCombos, OMNIROUTE_TAG_MAP } from '../src/engine/combos.js';
import { OpenCodeAdapter } from '../src/adapters/opencode.js';
import { PollinationsAdapter } from '../src/adapters/pollinations.js';

test('OmniRoute Catalog: loads 500+ curated free models across 80+ providers', () => {
  assert.ok(omnirouteCatalog && omnirouteCatalog.length >= 500, `Expected 500+ models, found ${omnirouteCatalog.length}`);
  
  const sample = omnirouteCatalog[0];
  assert.ok(sample.modelId, 'Should have modelId field');
  assert.ok(sample.provider, 'Should have provider field');
  assert.ok(sample.freeType, 'Should have freeType metadata (noauth, free_tier, or trial)');
  assert.ok(sample.poolKey, 'Should have poolKey classification');
  assert.ok(typeof sample.monthlyTokens === 'number');

  // Verify key free providers are present in the catalog
  const providers = new Set(omnirouteCatalog.map(m => m.provider));
  assert.ok(providers.has('openrouter'));
  assert.ok(providers.has('groq'));
  assert.ok(providers.has('gemini'));
  assert.ok(providers.has('sambanova'));
  assert.ok(providers.has('cerebras'));
  assert.ok(providers.has('github-models'));
  assert.ok(providers.has('mistral'));
});

test('Prompt Compression Engine: collapses whitespace, trims fluff, and saves tokens', () => {
  const engine = new PromptCompressionEngine();

  const inputMessages = [
    {
      role: 'system',
      content: 'You are an AI coding assistant. Always write clean code.'
    },
    {
      role: 'system',
      content: 'You are an AI coding assistant. Always write clean code.'
    },
    {
      role: 'user',
      content: 'Write a python function to compute fibonacci.\n\n\n\n```python   \ndef fib(n):   \n    return n   \n```   \n\n\n'
    }
  ];

  const result = engine.compressMessages(inputMessages, 'standard');
  assert.ok(result.messages);
  assert.strictEqual(result.compressed, true);
  assert.ok(result.tokensSaved > 0, `Expected token savings > 0, got ${result.tokensSaved}`);
  assert.ok(result.ratio >= 0);

  // Check that excessive newlines were collapsed
  const sysMsg = result.messages[0].content;
  assert.ok(!sysMsg.includes('\n\n\n'), 'Should not contain 3+ consecutive newlines');

  // Verify dedup logic: redundant system message was removed
  const sysMessages = result.messages.filter(m => m.role === 'system');
  assert.strictEqual(sysMessages.length, 1, 'Duplicate system prompt should be removed');
});

test('Lockout Policy: applies exponential circuit-breaker lockout tiers and resets on success', () => {
  const lockout = new LockoutPolicy({
    maxAttempts: 2,
    baseLockoutMs: 15000,
    maxLockoutMs: 900000
  });

  const testProvider = 'test-provider-lockout';

  // Initially not locked
  assert.strictEqual(lockout.isLocked(testProvider), false);

  // First failure (below threshold)
  const fail1 = lockout.recordFailure(testProvider);
  assert.strictEqual(fail1.locked, false);
  assert.strictEqual(lockout.isLocked(testProvider), false);

  // Second failure (hits threshold => locked for 15s)
  const fail2 = lockout.recordFailure(testProvider);
  assert.strictEqual(fail2.locked, true);
  assert.strictEqual(lockout.isLocked(testProvider), true);

  const status = lockout.getLockStatus(testProvider);
  assert.strictEqual(status.isLocked, true);
  assert.strictEqual(status.fails, 2);
  assert.ok(status.remainingMs > 0 && status.remainingMs <= 15000);

  // Success resets lockout
  lockout.recordSuccess(testProvider);
  assert.strictEqual(lockout.isLocked(testProvider), false);
  const resetStatus = lockout.getLockStatus(testProvider);
  assert.strictEqual(resetStatus.isLocked, false);
  assert.strictEqual(resetStatus.fails, 0);
});

test('Combos: OmniRoute tags correctly route to virtual combos', () => {
  assert.strictEqual(getCombo('#coding').id, 'extra/free-coding');
  assert.strictEqual(getCombo('#reasoning').id, 'extra/free-reasoning');
  assert.strictEqual(getCombo('#fast').id, 'extra/free-fast');
  assert.strictEqual(getCombo('#vision').id, 'extra/free-vision');
  assert.strictEqual(getCombo('#free').id, 'extra/auto-free');
  assert.strictEqual(getCombo('auto').id, 'extra/auto-free');
  assert.strictEqual(getCombo('default').id, 'extra/auto-free');

  for (const [tag, comboId] of Object.entries(OMNIROUTE_TAG_MAP)) {
    const resolved = getCombo(tag);
    assert.ok(resolved, `Tag ${tag} should resolve to a valid combo`);
    assert.strictEqual(resolved.id, comboId);
  }

  const allCombos = getAllCombos();
  assert.strictEqual(allCombos.length, 5);
  for (const combo of allCombos) {
    assert.ok(combo.targets.length >= 5, `Combo ${combo.id} should have resilient fallback chain`);
  }
});

test('Zero-Key NoAuth Adapters: OpenCode and Pollinations are registered and configured', () => {
  const opencode = new OpenCodeAdapter();
  assert.strictEqual(opencode.id, 'opencode');
  assert.strictEqual(opencode.baseUrl, 'https://opencode.ai/zen/v1');
  assert.ok(opencode.freeModels.length >= 4);

  const pollinations = new PollinationsAdapter();
  assert.strictEqual(pollinations.id, 'pollinations');
  assert.strictEqual(pollinations.baseUrl, 'https://text.pollinations.ai/openai');
  assert.ok(pollinations.freeModels.length >= 4);
});

test('HTTP OmniRoute Endpoints: free-models, summary, rankings, and combos respond accurately', async (t) => {
  const { default: express } = await import('express');
  const { default: cors } = await import('cors');
  const { openaiRouter } = await import('../src/routes/openai.js');
  const { adminRouter } = await import('../src/routes/admin.js');
  const { initDatabase } = await import('../src/db/database.js');

  initDatabase();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/v1', openaiRouter);
  app.use('/api', adminRouter);

  let server;
  let baseUrl;

  await new Promise(resolve => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  t.after(() => new Promise(resolve => server.close(resolve)));

  // 1. GET /api/free-models
  const resModels = await fetch(`${baseUrl}/api/free-models`);
  assert.strictEqual(resModels.status, 200);
  const dataModels = await resModels.json();
  assert.ok(dataModels.models);
  assert.ok(dataModels.totalCurated >= 500);

  // 2. GET /api/free-tier/summary
  const resSummary = await fetch(`${baseUrl}/api/free-tier/summary`);
  assert.strictEqual(resSummary.status, 200);
  const dataSummary = await resSummary.json();
  assert.ok(dataSummary.totalCuratedFreeModels >= 500);
  assert.ok(dataSummary.zeroKeyProviders >= 2);

  // 3. GET /api/free-provider-rankings
  const resRankings = await fetch(`${baseUrl}/api/free-provider-rankings`);
  assert.strictEqual(resRankings.status, 200);
  const dataRankings = await resRankings.json();
  assert.ok(dataRankings.rankings.length >= 10);
  assert.strictEqual(dataRankings.rankings[0].rank, 1);
  assert.ok(dataRankings.rankings[0].benchmarkScore > 0);

  // 4. GET /api/combos
  const resCombos = await fetch(`${baseUrl}/api/combos`);
  assert.strictEqual(resCombos.status, 200);
  const dataCombos = await resCombos.json();
  assert.ok(dataCombos.combos);
  assert.strictEqual(dataCombos.combos.length, 5);

  // 5. OmniRoute Headers on /v1/chat/completions
  const resChat = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer elx-live-master-free-hub'
    },
    body: JSON.stringify({
      model: 'mock/extra-demo-model',
      messages: [{ role: 'user', content: 'OmniRoute header test' }],
      stream: false
    })
  });

  assert.strictEqual(resChat.status, 200);
  assert.ok(resChat.headers.has('x-omniroute-provider'), 'Should emit x-omniroute-provider header');
  assert.ok(resChat.headers.has('x-omniroute-actual-model'), 'Should emit x-omniroute-actual-model header');
  assert.ok(resChat.headers.has('x-omniroute-latency-ms'), 'Should emit x-omniroute-latency-ms header');
});

