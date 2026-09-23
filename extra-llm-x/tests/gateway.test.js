import test from 'node:test';
import assert from 'node:assert';
import express from 'express';
import cors from 'cors';
import { initDatabase } from '../src/db/database.js';
import { openaiRouter } from '../src/routes/openai.js';
import { adminRouter } from '../src/routes/admin.js';

initDatabase();

const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));
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
  await new Promise(resolve => server.close(resolve));
});

test('HTTP: GET /health returns status ok', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'ok');
});

test('HTTP: GET /api/providers/portals returns all 17 portals', async () => {
  const res = await fetch(`${baseUrl}/api/providers/portals`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.length, 17);
});

test('HTTP: GET /v1/models rejects unauthenticated calls', async () => {
  const res = await fetch(`${baseUrl}/v1/models`);
  assert.strictEqual(res.status, 401);
});

test('HTTP: GET /v1/models succeeds with client token', async () => {
  const res = await fetch(`${baseUrl}/v1/models`, {
    headers: { 'Authorization': 'Bearer elx-live-universal-agent-free-hub' }
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.object, 'list');
  assert.ok(data.data.length > 0);
});

test('HTTP: POST /v1/chat/completions executes non-streaming completion', async () => {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer elx-live-universal-agent-free-hub'
    },
    body: JSON.stringify({
      model: 'extra/auto-free',
      messages: [{ role: 'user', content: 'Testing non-streaming' }],
      stream: false
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.object, 'chat.completion');
  assert.ok(data.choices[0].message.content.length > 0);
});

test('HTTP: POST /v1/chat/completions handles streaming SSE properly', async () => {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer elx-live-universal-agent-free-hub'
    },
    body: JSON.stringify({
      model: 'extra/auto-free',
      messages: [{ role: 'user', content: 'Testing streaming SSE' }],
      stream: true
    })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('content-type'), 'text/event-stream; charset=utf-8');

  const text = await res.text();
  assert.ok(text.includes('data: '));
  assert.ok(text.includes('[DONE]'));
});
