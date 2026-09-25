import test from 'node:test';
import assert from 'node:assert';
import { adapterRegistry } from '../src/adapters/index.js';

const newExtendedIds = [
  'duckduckgo', 'blackbox', 'shuttleai', 'upstage', 'runpod',
  'lambda', 'baichuan', 'hunyuan', 'sensenova', 'monsterapi'
];

test('Extended 10 Adapters: all 10 adapters are registered in AdapterRegistry', () => {
  for (const id of newExtendedIds) {
    const adapter = adapterRegistry.get(id);
    assert.ok(adapter, `Adapter ${id} must be registered in registry`);
    assert.ok(adapter.name, `Adapter ${id} must have a name`);
    assert.ok(adapter.badge, `Adapter ${id} must have a badge`);
    assert.ok(adapter.getKeyUrl, `Adapter ${id} must have a getKeyUrl`);
  }
});

test('Extended 10 Adapters: discoverModels() returns valid model definitions', async () => {
  for (const id of newExtendedIds) {
    const adapter = adapterRegistry.get(id);
    const models = await adapter.discoverModels();
    assert.ok(Array.isArray(models), `Adapter ${id} models must be an array`);
    assert.ok(models.length >= 2, `Adapter ${id} must offer at least 2 models, got ${models.length}`);
    for (const m of models) {
      assert.strictEqual(m.provider, id);
      assert.ok(m.id.startsWith(`${id}/`));
      assert.ok(m.context_window > 0);
    }
  }
});

test('Extended 10 Adapters: zero-key proxies marked ready in portals', () => {
  const portals = adapterRegistry.getPortals();
  const ddg = portals.find(p => p.id === 'duckduckgo');
  const blackbox = portals.find(p => p.id === 'blackbox');

  assert.ok(ddg);
  assert.ok(blackbox);
  assert.strictEqual(ddg.isNoAuth, true);
  assert.strictEqual(blackbox.isNoAuth, true);
  assert.strictEqual(ddg.status, 'ready');
  assert.strictEqual(blackbox.status, 'ready');
});

test('Extended 10 Adapters: key-based adapters reject missing API keys with 401', async () => {
  const keyRequiredIds = ['upstage', 'runpod', 'lambda', 'baichuan', 'hunyuan', 'sensenova', 'monsterapi'];

  for (const id of keyRequiredIds) {
    const adapter = adapterRegistry.get(id);
    await assert.rejects(
      async () => {
        await adapter.executeChat({
          apiKey: '',
          model: `${id}/test-model`,
          messages: [{ role: 'user', content: 'test' }]
        });
      },
      (err) => {
        assert.strictEqual(err.status, 401, `Adapter ${id} must return 401 when apiKey is empty`);
        return true;
      }
    );
  }
});
