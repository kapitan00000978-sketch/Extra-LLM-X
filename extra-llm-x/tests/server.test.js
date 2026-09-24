import test from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { db, initDatabase, KeyStore, ModelStore, LogStore } from '../src/db/database.js';
import { adapterRegistry } from '../src/adapters/index.js';
import { routerEngine } from '../src/engine/router.js';
import { getAllCombos, getCombo } from '../src/engine/combos.js';

initDatabase();

test('Database & KeyStore: creates and verifies default system API key', () => {
  const keys = KeyStore.getAllSystemKeys();
  assert.ok(keys.length >= 1, 'Should have at least 1 system key');

  const defaultKey = keys.find(k => k.key === 'elx-live-universal-agent-free-hub');
  assert.ok(defaultKey, 'Default Universal Agent key must exist');

  const verified = KeyStore.verifySystemKey('elx-live-universal-agent-free-hub');
  assert.strictEqual(verified.active, 1);

  const verifiedBearer = KeyStore.verifySystemKey('Bearer elx-live-universal-agent-free-hub');
  assert.strictEqual(verifiedBearer.active, 1);
});

test('Database & KeyStore: can create and revoke new client API keys', () => {
  const newKey = KeyStore.createSystemKey('Test Agent Key', 50);
  assert.ok(newKey.key.startsWith('elx-live-'));
  assert.strictEqual(newKey.name, 'Test Agent Key');

  const verified = KeyStore.verifySystemKey(newKey.key);
  assert.ok(verified);

  // Revoke / delete
  KeyStore.deleteSystemKey(newKey.key);
  const verifyDeleted = KeyStore.verifySystemKey(newKey.key);
  assert.strictEqual(verifyDeleted, null);
});

test('Database & ProviderKeys: manages provider keys and cooldown', () => {
  const testKey = KeyStore.addProviderKey('groq', 'gsk_test1234567890', 'Groq Test Key');
  assert.strictEqual(testKey.provider, 'groq');

  const available = KeyStore.getAvailableProviderKey('groq');
  assert.ok(available, 'Should find available groq key');
  assert.strictEqual(available.api_key, 'gsk_test1234567890');

  // Trigger cooldown
  KeyStore.markKeyCooldown(available.id, 30);
  const availableDuringCooldown = KeyStore.getAvailableProviderKey('groq');
  assert.strictEqual(availableDuringCooldown, null, 'Should not return key in cooldown');

  // Clean up
  KeyStore.deleteProviderKey(available.id);
});

test('Virtual Combos: all standard combos defined properly', () => {
  const combos = getAllCombos();
  assert.ok(combos.length >= 4);

  const autoFree = getCombo('extra/auto-free');
  assert.ok(autoFree);
  assert.ok(autoFree.targets.length >= 5);

  const coding = getCombo('extra/free-coding');
  assert.ok(coding);
  assert.ok(coding.targets.some(t => t.provider === 'mistral' || t.provider === 'sambanova'));

  const fast = getCombo('extra/free-fast');
  assert.ok(fast);
  assert.ok(fast.targets.some(t => t.provider === 'cerebras' || t.provider === 'groq'));
});

test('RouterEngine: resolves model execution plans', () => {
  const planAuto = routerEngine.resolvePlan('extra/auto-free');
  assert.strictEqual(planAuto.combo, 'extra/auto-free');
  assert.ok(planAuto.targets.length > 0);

  const planBareGroq = routerEngine.resolvePlan('groq/llama-3.3-70b-versatile');
  assert.strictEqual(planBareGroq.targets[0].provider, 'groq');
  assert.strictEqual(planBareGroq.targets[0].model, 'llama-3.3-70b-versatile');
});

test('Adapter Registry: contains all 24+ free providers', () => {
  const portals = adapterRegistry.getPortals();
  const providerIds = portals.map(p => p.id);

  assert.ok(providerIds.includes('groq'));
  assert.ok(providerIds.includes('gemini'));
  assert.ok(providerIds.includes('openrouter'));
  assert.ok(providerIds.includes('sambanova'));
  assert.ok(providerIds.includes('cerebras'));
  assert.ok(providerIds.includes('github'));
  assert.ok(providerIds.includes('mistral'));
  assert.ok(providerIds.includes('huggingface'));
  assert.ok(portals.length >= 20);
});
