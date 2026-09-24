import test from 'node:test';
import assert from 'node:assert/strict';
import { responseCache } from '../src/engine/cache.js';
import { freeEmbeddings } from '../src/engine/embeddings.js';
import { routerEngine } from '../src/engine/router.js';

test('ResponseCache: saves, hits, tracks tokens and purges cleanly', (t) => {
  responseCache.clear();

  const reqObj = {
    requestedModel: 'extra/auto-free',
    messages: [{ role: 'user', content: 'What is Universal Agent HP?' }],
    temperature: 0.7
  };

  const hash = responseCache.computeHash(reqObj);
  assert.ok(hash && typeof hash === 'string', 'Computes SHA-256 hash');

  // Should miss before saving
  const miss = responseCache.get(hash);
  assert.strictEqual(miss, null, 'Cache miss on first call');

  // Save response
  const dummyResponse = {
    id: 'chatcmpl-test-cache',
    object: 'chat.completion',
    choices: [{ message: { role: 'assistant', content: 'Universal Agent HP is an autonomous AI agent.' } }],
    usage: { prompt_tokens: 15, completion_tokens: 20, total_tokens: 35 }
  };

  responseCache.set(hash, 'extra/auto-free', dummyResponse, 15, 20);

  // Should hit now
  const hit = responseCache.get(hash);
  assert.ok(hit, 'Cache hit succeeded');
  assert.strictEqual(hit.promptTokens, 15);
  assert.strictEqual(hit.completionTokens, 20);
  assert.strictEqual(hit.data.choices[0].message.content, 'Universal Agent HP is an autonomous AI agent.');

  // Check stats
  const stats = responseCache.getStats();
  assert.ok(stats.entries >= 1, 'Stats reflects cached entries');
  assert.ok(stats.tokensSaved >= 35, 'Tokens saved calculated correctly');

  // Purge
  responseCache.clear();
  assert.strictEqual(responseCache.get(hash), null, 'Cache purged cleanly');
});

test('FreeEmbeddingsEngine: generates normalized 1536-dim vectors with semantic cosine similarity', async (t) => {
  const textA = 'Python programming and software engineering';
  const textB = 'Python coding and development';
  const textC = 'Baking sourdough bread in a kitchen oven';

  const vecA = freeEmbeddings.generateDeterministicEmbedding(textA, 1536);
  const vecB = freeEmbeddings.generateDeterministicEmbedding(textB, 1536);
  const vecC = freeEmbeddings.generateDeterministicEmbedding(textC, 1536);

  assert.strictEqual(vecA.length, 1536, 'Vector has exactly 1536 dimensions');
  assert.strictEqual(vecB.length, 1536, 'Vector has exactly 1536 dimensions');

  // Helper cosine similarity
  function cosineSim(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  const simIdentical = cosineSim(vecA, vecA);
  const simRelated = cosineSim(vecA, vecB);
  const simUnrelated = cosineSim(vecA, vecC);

  assert.ok(Math.abs(simIdentical - 1.0) < 0.001, 'Self-similarity is 1.0');
  assert.ok(simRelated > simUnrelated, `Related concepts (${simRelated.toFixed(3)}) have higher similarity than unrelated (${simUnrelated.toFixed(3)})`);

  // Test full engine output
  const res = await freeEmbeddings.getEmbeddings({ input: ['Hello world', 'Universal Agent'] });
  assert.strictEqual(res.data.length, 2);
  assert.strictEqual(res.data[0].object, 'embedding');
  assert.ok(Array.isArray(res.data[0].embedding));
});

test('RouterEngine: Capability and Requirement Guards', (t) => {
  // Test vision requirement detection
  const visionMsg = [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this screenshot' },
        { type: 'image_url', image_url: { url: 'https://example.com/test.png' } }
      ]
    }
  ];

  const reqVision = routerEngine.detectRequirements(visionMsg, []);
  assert.strictEqual(reqVision.hasVision, true, 'Detects image_url payload');

  const visionPlan = routerEngine.resolvePlan('extra/auto-free', reqVision);
  assert.strictEqual(visionPlan.combo, 'extra/free-vision', 'Automatically re-routes to free-vision combo when vision payload detected');

  // Test tools requirement detection
  const sampleTools = [
    {
      type: 'function',
      function: {
        name: 'execute_command',
        description: 'Run a shell command',
        parameters: { type: 'object', properties: { cmd: { type: 'string' } } }
      }
    }
  ];

  const reqTools = routerEngine.detectRequirements([{ role: 'user', content: 'Run ls' }], sampleTools);
  assert.strictEqual(reqTools.hasTools, true, 'Detects tools payload');

  const toolPlan = routerEngine.resolvePlan('extra/auto-free', reqTools);
  // First target should be groq or gemini (reliable function calling)
  const firstProvider = toolPlan.targets[0].provider;
  assert.ok(['groq', 'gemini', 'sambanova', 'cerebras', 'mistral'].includes(firstProvider), `Tool target prioritized: ${firstProvider}`);
});

test('SpeculativeHedgingEngine: races fast primary or falls back to hedged candidate', async (t) => {
  const { SpeculativeHedgingEngine } = await import('../src/engine/hedging.js');
  const hedging = new SpeculativeHedgingEngine(50); // 50ms hedge delay

  // Case 1: Primary is fast (< 50ms)
  const resFast = await hedging.executeHedged({
    primaryFn: async () => ({ text: 'primary fast' }),
    fallbackFn: async () => ({ text: 'fallback' }),
    hedgeDelayMs: 50
  });
  assert.strictEqual(resFast.text, 'primary fast');
  assert.strictEqual(resFast.hedged, false, 'Primary won race');

  // Case 2: Primary is slow (> 50ms), fallback completes first
  const resHedged = await hedging.executeHedged({
    primaryFn: () => new Promise(resolve => setTimeout(() => resolve({ text: 'primary slow' }), 150)),
    fallbackFn: async () => ({ text: 'fallback fast' }),
    hedgeDelayMs: 40
  });
  assert.strictEqual(resHedged.text, 'fallback fast');
  assert.strictEqual(resHedged.hedged, true, 'Fallback won race due to slow primary');
});

test('ProviderBenchmarkingEngine: returns dynamically ranked providers', async (t) => {
  const { benchmarkEngine } = await import('../src/engine/benchmarking.js');
  const rankings = benchmarkEngine.getRankings();

  assert.ok(Array.isArray(rankings), 'Rankings is an array');
  assert.ok(rankings.length >= 10, 'Contains at least 10 providers');
  assert.strictEqual(rankings[0].rank, 1, 'Top provider has rank 1');
  assert.ok(rankings[0].benchmarkScore >= rankings[1].benchmarkScore, 'Rankings are sorted descending by score');
  assert.ok(rankings.some(r => r.id === 'cerebras' && r.speedTokPerSec > 1000), 'Identifies Cerebras ultra-high throughput');
});

test('WebhookStore & WebhookEngine: registers, formats alerts, and tracks triggers', async (t) => {
  const { WebhookStore } = await import('../src/db/database.js');
  const { webhookEngine } = await import('../src/engine/webhooks.js');

  const whk = WebhookStore.createWebhook({
    url: 'https://example.com/webhook-test',
    events: 'failover,rate_limit'
  });
  assert.ok(whk.id && whk.id.startsWith('whk_'));
  assert.strictEqual(whk.url, 'https://example.com/webhook-test');

  const matching = WebhookStore.getWebhooksForEvent('failover');
  assert.ok(matching.some(w => w.id === whk.id));

  const nonMatching = WebhookStore.getWebhooksForEvent('milestone');
  assert.ok(!nonMatching.some(w => w.id === whk.id));

  // Format message test
  const msg = webhookEngine.formatDiscordMessage('failover', {
    requestedModel: 'extra/auto-free',
    failedProvider: 'groq',
    targetProvider: 'gemini',
    targetModel: 'gemini-2.0-flash',
    latencyMs: 120
  });
  assert.ok(msg.includes('Failover'));
  assert.ok(msg.includes('gemini'));

  WebhookStore.deleteWebhook(whk.id);
  assert.strictEqual(WebhookStore.getWebhook(whk.id), undefined);
});

test('BatchStore: manages asynchronous batch job state and progress', async (t) => {
  const { BatchStore } = await import('../src/db/database.js');

  const batchId = `batch_test_${Date.now()}`;
  const batch = BatchStore.createBatch({
    id: batchId,
    totalRequests: 5,
    requestsJson: JSON.stringify([{ custom_id: 'req_1' }])
  });

  assert.strictEqual(batch.id, batchId);
  assert.strictEqual(batch.status, 'in_progress');

  BatchStore.updateBatchProgress(batchId, {
    completedRequests: 4,
    failedRequests: 1,
    status: 'completed',
    resultsJson: JSON.stringify([{ id: 'res_1' }]),
    completedAt: Date.now()
  });

  const updated = BatchStore.getBatch(batchId);
  assert.strictEqual(updated.status, 'completed');
  assert.strictEqual(updated.completed_requests, 4);
  assert.strictEqual(updated.failed_requests, 1);
});


