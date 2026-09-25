import test from 'node:test';
import assert from 'node:assert';
import { adapterRegistry } from '../src/adapters/index.js';

test('AdapterRegistry: registers all required 24 adapters', () => {
  const allAdapters = adapterRegistry.getAll();
  assert.ok(allAdapters.length >= 24, `Expected at least 24 adapters, found ${allAdapters.length}`);

  const requiredIds = [
    'openrouter', 'groq', 'gemini', 'cerebras', 'sambanova',
    'github', 'mistral', 'huggingface', 'together', 'cloudflare',
    'fireworks', 'deepinfra', 'novita', 'cohere', 'nvidia',
    'siliconflow', 'zhipu', 'deepseek', 'hyperbolic', 'aimlapi',
    'chutes', 'ollama', 'lmstudio', 'mock'
  ];

  for (const id of requiredIds) {
    const adapter = adapterRegistry.get(id);
    assert.ok(adapter, `Adapter for ${id} must exist in registry`);
    assert.ok(adapter.name, `Adapter ${id} must have a name`);
    assert.ok(adapter.badge, `Adapter ${id} must have a badge`);
    assert.ok(adapter.getKeyUrl, `Adapter ${id} must have a getKeyUrl`);
  }
});

test('AdapterRegistry: discoverModels returns formatted free models for core adapters', async () => {
  const groq = adapterRegistry.get('groq');
  const groqModels = await groq.discoverModels();
  assert.ok(groqModels.length > 0);
  assert.strictEqual(groqModels[0].is_free, 1);
  assert.strictEqual(groqModels[0].provider, 'groq');

  const gemini = adapterRegistry.get('gemini');
  const geminiModels = await gemini.discoverModels();
  assert.ok(geminiModels.length > 0);
  assert.strictEqual(geminiModels[0].is_free, 1);
  assert.strictEqual(geminiModels[0].provider, 'gemini');

  const deepseek = adapterRegistry.get('deepseek');
  const deepseekModels = await deepseek.discoverModels();
  assert.ok(deepseekModels.length >= 2);
  assert.strictEqual(deepseekModels[0].provider, 'deepseek');
  assert.ok(deepseekModels.some(m => m.model_id === 'deepseek-reasoner'));

  const hyperbolic = adapterRegistry.get('hyperbolic');
  const hypModels = await hyperbolic.discoverModels();
  assert.ok(hypModels.length > 0);
  assert.strictEqual(hypModels[0].provider, 'hyperbolic');

  const mock = adapterRegistry.get('mock');
  const mockModels = await mock.discoverModels();
  assert.ok(mockModels.length > 0);
  assert.strictEqual(mockModels[0].is_free, 1);
});

test('BaseAdapter: correctly classifies rate limit, auth, and server errors', () => {
  const groq = adapterRegistry.get('groq');

  const rateLimitErr = groq.classifyError(new Error('Rate limit exceeded: 30 RPM reached'), 429);
  assert.strictEqual(rateLimitErr.isRateLimit, true);

  const authErr = groq.classifyError(new Error('Invalid API Key provided'), 401);
  assert.strictEqual(authErr.isAuth, true);

  const serverErr = groq.classifyError(new Error('Internal server error'), 503);
  assert.strictEqual(serverErr.isServer, true);
});

test('BaseAdapter: parses Retry-After and x-ratelimit-reset headers accurately', () => {
  const base = adapterRegistry.get('groq');

  // Retry-after integer delta
  const headers1 = { 'retry-after': '45' };
  const cd1 = base.parseCooldownSeconds(headers1, 60);
  assert.strictEqual(cd1, 45);

  // x-ratelimit-reset delta
  const headers2 = { 'x-ratelimit-reset': '15' };
  const cd2 = base.parseCooldownSeconds(headers2, 60);
  assert.strictEqual(cd2, 15);

  // fallback to default
  const cd3 = base.parseCooldownSeconds({}, 60);
  assert.strictEqual(cd3, 60);
});

