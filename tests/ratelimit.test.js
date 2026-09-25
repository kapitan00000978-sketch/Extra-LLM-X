import test from 'node:test';
import assert from 'node:assert';
import { KeyStore } from '../src/db/database.js';
import { adapterRegistry } from '../src/adapters/index.js';

test('RateLimit: Multi-key rotation picks the next available key when one is on cooldown', () => {
  const provider = 'testprovider_' + Date.now();
  
  // Add key 1 and key 2
  const k1 = KeyStore.addProviderKey(provider, 'key-alpha-1234', 'Primary Key');
  const k2 = KeyStore.addProviderKey(provider, 'key-beta-5678', 'Secondary Key');

  // Both are available initially
  let selected = KeyStore.getAvailableProviderKey(provider);
  assert.ok(selected);
  assert.strictEqual(selected.api_key, 'key-alpha-1234');

  // Put key 1 on cooldown
  KeyStore.markKeyCooldown(k1.id, 60);

  // Now key 2 should be selected automatically
  selected = KeyStore.getAvailableProviderKey(provider);
  assert.ok(selected);
  assert.strictEqual(selected.api_key, 'key-beta-5678');

  // Put key 2 on cooldown as well
  KeyStore.markKeyCooldown(k2.id, 60);

  // Now no keys should be available
  selected = KeyStore.getAvailableProviderKey(provider);
  assert.strictEqual(selected, null);

  // Cleanup
  KeyStore.deleteProviderKey(k1.id);
  KeyStore.deleteProviderKey(k2.id);
});

test('RateLimit: parseCooldownSeconds handles numeric, delta, and clamps limits safely', () => {
  const adapter = adapterRegistry.get('groq');

  // Safe clamp between 5s and 300s
  assert.strictEqual(adapter.parseCooldownSeconds({ 'retry-after': '2' }, 60), 5); // Clamped up to min 5
  assert.strictEqual(adapter.parseCooldownSeconds({ 'retry-after': '45' }, 60), 45);
  assert.strictEqual(adapter.parseCooldownSeconds({ 'retry-after': '999' }, 60), 300); // Clamped down to max 300
});

test('RateLimit: classifyError flags various vendor rate limit messages', () => {
  const adapter = adapterRegistry.get('gemini');

  const err1 = adapter.classifyError(new Error('RESOURCE_EXHAUSTED: quota exceeded'), 429);
  assert.strictEqual(err1.isRateLimit, true);

  const err2 = adapter.classifyError(new Error('Rate limit reached for requests per minute (RPM)'), 429);
  assert.strictEqual(err2.isRateLimit, true);

  const err3 = adapter.classifyError(new Error('Tokens Per Day (TPD) limit exhausted'), 429);
  assert.strictEqual(err3.isRateLimit, true);
});

