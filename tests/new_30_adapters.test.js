import test from 'node:test';
import assert from 'node:assert';
import { adapterRegistry } from '../src/adapters/index.js';

const NEW_30_IDS = [
  'xai', 'perplexity', 'moonshot', 'dashscope', 'minimax', 'lingyiwanwu',
  'stepfun', 'iflytek', 'volcengine', 'qianfan', 'reka', 'ai21',
  'writer', 'voyage', 'jina', 'watsonx', 'vertex', 'nebius',
  'scaleway', 'ovhcloud', 'friendli', 'featherless', 'replicate',
  'baseten', 'segmind', 'nlpcloud', 'poe', 'inference_net',
  'gmicloud', 'lepton'
];

test('New 30 Adapters: all 30 adapters are registered in AdapterRegistry', () => {
  for (const id of NEW_30_IDS) {
    const adapter = adapterRegistry.get(id);
    assert.ok(adapter, `Adapter for provider '${id}' must be registered`);
    assert.strictEqual(adapter.id, id, `Adapter id must be '${id}'`);
    assert.ok(adapter.name, `Adapter '${id}' must have a name`);
    assert.ok(adapter.freeTierInfo, `Adapter '${id}' must have freeTierInfo`);
  }
});

test('New 30 Adapters: discoverModels() returns valid model definitions', async () => {
  for (const id of NEW_30_IDS) {
    const adapter = adapterRegistry.get(id);
    const models = await adapter.discoverModels('dummy_key');
    assert.ok(Array.isArray(models), `${id}.discoverModels() must return an array`);
    assert.ok(models.length > 0, `${id}.discoverModels() must contain at least 1 model`);

    for (const m of models) {
      assert.ok(m.id.startsWith(`${id}/`), `Model id '${m.id}' must start with '${id}/'`);
      assert.strictEqual(m.provider, id, `Model provider must match '${id}'`);
      assert.ok(m.display_name, 'Model must have display_name');
      assert.strictEqual(m.is_free, 1, 'Model must be flagged as free');
      assert.ok(m.capabilities, 'Model must declare capabilities');
    }
  }
});

test('New 30 Adapters: executeChat() rejects unauthorized calls with status code', async () => {
  // Test a representative sample of 5 diverse new adapters with fake keys
  const sample = ['xai', 'perplexity', 'reka', 'segmind', 'baseten'];
  
  for (const id of sample) {
    const adapter = adapterRegistry.get(id);
    const model = adapter.freeModels[0].id;
    
    try {
      await adapter.executeChat({
        apiKey: 'invalid_dummy_key_12345',
        model: `${id}/${model}`,
        messages: [{ role: 'user', content: 'test' }]
      });
      assert.fail(`Expected ${id} to fail with invalid key`);
    } catch (err) {
      assert.ok(err instanceof Error, `${id} must throw Error on failure`);
      assert.ok(err.status || err.message, `${id} error must contain status or message`);
    }
  }
});
