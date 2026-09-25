import test from 'node:test';
import assert from 'node:assert';
import express from 'express';
import cors from 'cors';
import { initDatabase, KeyStore } from '../src/db/database.js';
import { openaiRouter } from '../src/routes/openai.js';
import { adminRouter } from '../src/routes/admin.js';

initDatabase();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/v1', openaiRouter);
app.use('/api', adminRouter);

let server;
let baseUrl;

test.before(async () => {
  await new Promise(resolve => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

test('AutoKey: GET /v1/keys/auto autonomously generates operational key', async () => {
  const res = await fetch(`${baseUrl}/v1/keys/auto`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.key.startsWith('elx-live-'));
  
  // Verify key is in database and valid
  const verified = KeyStore.verifySystemKey(data.key);
  assert.ok(verified, 'Generated key must exist in KeyStore');
  assert.strictEqual(verified.active, 1);
});

test('AutoKey: POST /api/keys/auto generates key with custom rate limit', async () => {
  const res = await fetch(`${baseUrl}/api/keys/auto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Auto CI Agent', rateLimit: 200 })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.key.startsWith('elx-live-'));
  assert.strictEqual(data.rate_limit_rpm, 200);
});

test('AutoKey: Bearer auto provisions key on the fly and succeeds', async () => {
  const res = await fetch(`${baseUrl}/v1/models`, {
    headers: { 'Authorization': 'Bearer auto' }
  });
  assert.strictEqual(res.status, 200);
  const autoKeyHeader = res.headers.get('x-extrallm-auto-key');
  assert.ok(autoKeyHeader, 'Must return X-ExtraLLM-Auto-Key header');
  assert.ok(autoKeyHeader.startsWith('elx-live-'));

  const verified = KeyStore.verifySystemKey(autoKeyHeader);
  assert.ok(verified, 'Key from Bearer auto must be automatically registered in database');
});

test('AutoKey: Bearer elx-auto also provisions key dynamically', async () => {
  const res = await fetch(`${baseUrl}/v1/models`, {
    headers: { 'Authorization': 'Bearer elx-auto' }
  });
  assert.strictEqual(res.status, 200);
  const autoKeyHeader = res.headers.get('x-extrallm-auto-key');
  assert.ok(autoKeyHeader.startsWith('elx-live-'));
});
