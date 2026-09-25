import test from 'node:test';
import assert from 'node:assert';
import { HealthStore } from '../src/db/database.js';
import { healthCheckEngine } from '../src/engine/health_check.js';

test('HealthStore: records and retrieves provider health status', () => {
  HealthStore.upsertHealth('groq', 'healthy', 120, null);
  const record = HealthStore.getHealth('groq');
  assert.ok(record, 'Health record should exist');
  assert.strictEqual(record.status, 'healthy');
  assert.strictEqual(record.latency_ms, 120);

  const all = HealthStore.getAllHealth();
  assert.ok(all.length > 0);
  assert.ok(all.some(h => h.provider === 'groq'));
});

test('HealthCheckEngine: checkProvider returns healthy for mock adapter', async () => {
  const result = await healthCheckEngine.checkProvider('mock');
  assert.strictEqual(result.provider, 'mock');
  assert.strictEqual(result.status, 'healthy');
  assert.ok(result.latency_ms >= 0);
});

test('HealthCheckEngine: checkProvider returns unconfigured for provider with no keys', async () => {
  const result = await healthCheckEngine.checkProvider('hyperbolic');
  assert.strictEqual(result.provider, 'hyperbolic');
  // If no keys configured in test db, status is unconfigured
  assert.strictEqual(result.status, 'unconfigured');
});

test('HealthCheckEngine: checkAll returns an array of provider health checks', async () => {
  const results = await healthCheckEngine.checkAll();
  assert.ok(Array.isArray(results));
  assert.ok(results.length >= 24, `Expected at least 24 results, got ${results.length}`);
  assert.ok(results.some(r => r.provider === 'mock' && r.status === 'healthy'));
});

