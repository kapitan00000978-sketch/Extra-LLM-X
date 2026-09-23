import test from 'node:test';
import assert from 'node:assert';
import { adapterRegistry } from '../src/adapters/index.js';

test('AdapterRegistry: registers all required 17 adapters', () => {
  const allAdapters = adapterRegistry.getAll();
  assert.ok(allAdapters.length >= 17, `Expected at least 17 adapters, found ${allAdapters.length}`);

  const requiredIds = [
    'openrouter', 'groq', 'gemini', 'cerebras', 'sambanova',
    'github', 'mistral', 'huggingface', 'together', 'cloudflare',
    'fireworks', 'deepinfra', 'novita', 'cohere', 'ollama',
    'lmstudio', 'mock'
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

  const mock = adapterRegistry.get('mock');
  const mockModels = await mock.discoverModels();
  assert.ok(mockModels.length > 0);
  assert.strictEqual(mockModels[0].is_free, 1);
});

test('BaseAdapter: correctly classifies rate limit and auth errors', () => {
  const groq = adapterRegistry.get('groq');

  const rateLimitErr = groq.classifyError(new Error('Rate limit exceeded: 30 RPM reached'), 429);
  assert.strictEqual(rateLimitErr.isRateLimit, true);

  const authErr = groq.classifyError(new Error('Invalid API Key provided'), 401);
  assert.strictEqual(authErr.isAuth, true);
});
