import test from 'node:test';
import assert from 'node:assert';
import { initDatabase, KeyStore, ModelStore, LogStore } from '../src/db/database.js';

initDatabase();

test('KeyStore: creates, verifies and revokes system API keys', () => {
  const defaultKey = KeyStore.verifySystemKey('elx-live-universal-agent-free-hub');
  assert.ok(defaultKey, 'Default key must be verified');
  assert.strictEqual(defaultKey.active, 1);

  const created = KeyStore.createSystemKey('Test Key 123', 90);
  assert.ok(created.key.startsWith('elx-live-'));
  assert.strictEqual(created.rate_limit_rpm, 90);

  const verified = KeyStore.verifySystemKey(created.key);
  assert.ok(verified);

  KeyStore.deleteSystemKey(created.key);
  const verifyRevoked = KeyStore.verifySystemKey(created.key);
  assert.strictEqual(verifyRevoked, null);
});

test('KeyStore: tracks provider keys and cooldown state', () => {
  const added = KeyStore.addProviderKey('groq', 'gsk_sample123', 'My Groq');
  assert.strictEqual(added.provider, 'groq');

  const available = KeyStore.getAvailableProviderKey('groq');
  assert.ok(available);
  assert.strictEqual(available.api_key, 'gsk_sample123');

  // Cooldown
  KeyStore.markKeyCooldown(available.id, 60);
  const duringCooldown = KeyStore.getAvailableProviderKey('groq');
  assert.strictEqual(duringCooldown, null);

  KeyStore.deleteProviderKey(available.id);
});

test('LogStore: records telemetry and computes savings accurately', () => {
  LogStore.record({
    clientKey: 'elx-live-sample',
    requestedModel: 'extra/auto-free',
    actualModel: 'llama-3.3-70b-versatile',
    provider: 'groq',
    promptTokens: 100,
    completionTokens: 200,
    latencyMs: 150,
    statusCode: 200
  });

  const stats = LogStore.getStats();
  assert.ok(stats.totalRequests >= 1);
  assert.ok(stats.totalTokens >= 300);
});
