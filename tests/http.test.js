import test from 'node:test';
import assert from 'node:assert';
import express from 'express';
import cors from 'cors';
import { initDatabase, KeyStore, ModelStore } from '../src/db/database.js';
import { openaiRouter } from '../src/routes/openai.js';
import { adminRouter } from '../src/routes/admin.js';
import { webhookRouter } from '../src/routes/webhooks.js';

initDatabase();

const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/v1', openaiRouter);
app.use('/api', adminRouter);
app.use('/api', webhookRouter);

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

test('HTTP: GET /health returns 200 ok', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'ok');
});

test('HTTP: GET /api/stats returns stats object', async () => {
  const res = await fetch(`${baseUrl}/api/stats`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok('totalTokens' in data);
  assert.ok('estimatedSavedUsd' in data);
});

test('HTTP: GET /api/providers/portals returns all free providers', async () => {
  const res = await fetch(`${baseUrl}/api/providers/portals`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length >= 9, `Expected at least 9 providers, found ${data.length}`);
});

test('HTTP: GET /v1/models fails without auth token', async () => {
  const res = await fetch(`${baseUrl}/v1/models`);
  assert.strictEqual(res.status, 401);
});

test('HTTP: GET /v1/models succeeds with valid system token', async () => {
  const res = await fetch(`${baseUrl}/v1/models`, {
    headers: { 'Authorization': 'Bearer elx-live-master-free-hub' }
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.object, 'list');
  assert.ok(Array.isArray(data.data));

  // Check that virtual combos are present
  const hasAutoFree = data.data.some(m => m.id === 'extra/auto-free');
  assert.ok(hasAutoFree, 'Must contain extra/auto-free combo');
});

test('HTTP: POST /v1/chat/completions validates empty messages', async () => {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer elx-live-master-free-hub'
    },
    body: JSON.stringify({ model: 'extra/auto-free', messages: [] })
  });
  assert.strictEqual(res.status, 400);
});

test('HTTP: POST /api/system-keys generates and persists key', async () => {
  const res = await fetch(`${baseUrl}/api/system-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Integration Test Key', rateLimit: 60 })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.key.key.startsWith('elx-live-'));

  // Verify can authenticate with the newly created key immediately!
  const verifyRes = await fetch(`${baseUrl}/v1/models`, {
    headers: { 'Authorization': `Bearer ${data.key.key}` }
  });
  assert.strictEqual(verifyRes.status, 200);
});

test('HTTP: POST /v1/embeddings returns valid OpenAI embedding format', async () => {
  const res = await fetch(`${baseUrl}/v1/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer elx-live-master-free-hub'
    },
    body: JSON.stringify({ input: ['AI Applications vector memory'] })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.object, 'list');
  assert.strictEqual(data.data.length, 1);
  assert.strictEqual(data.data[0].object, 'embedding');
  assert.strictEqual(data.data[0].embedding.length, 1536);
  assert.ok(data.usage && data.usage.prompt_tokens > 0);
});

test('HTTP: POST /v1/images/generations returns valid image generation url', async () => {
  const res = await fetch(`${baseUrl}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer elx-live-master-free-hub'
    },
    body: JSON.stringify({ prompt: 'A futuristic cybernetic agent', model: 'flux' })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.created);
  assert.ok(Array.isArray(data.data));
  assert.strictEqual(data.data.length, 1);
  assert.ok(data.data[0].url.includes('image.pollinations.ai'));
});

test('HTTP: GET /api/cache/stats and POST /api/cache/clear manage semantic cache', async () => {
  const statsRes = await fetch(`${baseUrl}/api/cache/stats`);
  assert.strictEqual(statsRes.status, 200);
  const stats = await statsRes.json();
  assert.ok('entries' in stats);
  assert.ok('hitRate' in stats);
  assert.ok('tokensSaved' in stats);

  const clearRes = await fetch(`${baseUrl}/api/cache/clear`, { method: 'POST' });
  assert.strictEqual(clearRes.status, 200);
  const clearData = await clearRes.json();
  assert.strictEqual(clearData.success, true);
});

test('HTTP: POST /v1/audio/transcriptions returns valid Whisper transcription', async () => {
  const res = await fetch(`${baseUrl}/v1/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer elx-live-master-free-hub'
    },
    body: JSON.stringify({ prompt: 'AI Applications audio stream transcription test' })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.text);
  assert.ok(data.text.length > 0);
});

test('HTTP: GET /api/integrations/config returns complete env and SDK config', async () => {
  const res = await fetch(`${baseUrl}/api/integrations/config`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.envSnippet.includes('OPENAI_API_BASE'));
  assert.ok(data.pythonSnippet.includes('client = openai.OpenAI'));
  assert.ok(data.nodeSnippet.includes('new OpenAI'));
  assert.ok(Array.isArray(data.combos));
});

test('HTTP: POST /api/agent/simulate executes multi-step DAG planning simulation', async () => {
  const res = await fetch(`${baseUrl}/api/agent/simulate`, { method: 'POST' });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.simulation, 'PASS');
  assert.strictEqual(data.steps.length, 2);
  assert.strictEqual(data.steps[0].status, 'completed');
  assert.strictEqual(data.steps[1].status, 'completed');
});

test('HTTP: GET /api/benchmarks/results and /api/free-provider-rankings return dynamic podium', async () => {
  const res = await fetch(`${baseUrl}/api/benchmarks/results`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.rankings));
  assert.ok(data.rankings.length >= 10);

  const resRank = await fetch(`${baseUrl}/api/free-provider-rankings`);
  assert.strictEqual(resRank.status, 200);
  const rankData = await resRank.json();
  assert.ok(Array.isArray(rankData.rankings));
  assert.strictEqual(rankData.rankings[0].rank, 1);
});

test('HTTP: POST /v1/batches and GET /v1/batches/:id process asynchronous requests', async () => {
  const batchBody = {
    requests: [
      {
        custom_id: 'batch_item_1',
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: 'extra/auto-free',
          messages: [{ role: 'user', content: 'Say Batch Alpha' }]
        }
      },
      {
        custom_id: 'batch_item_2',
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: 'extra/auto-free',
          messages: [{ role: 'user', content: 'Say Batch Beta' }]
        }
      }
    ]
  };

  const createRes = await fetch(`${baseUrl}/v1/batches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer elx-live-master-free-hub'
    },
    body: JSON.stringify(batchBody)
  });

  assert.strictEqual(createRes.status, 201);
  const createData = await createRes.json();
  assert.ok(createData.id && createData.id.startsWith('batch_'));
  assert.strictEqual(createData.status, 'in_progress');
  assert.strictEqual(createData.request_counts.total, 2);

  // Poll status
  const getRes = await fetch(`${baseUrl}/v1/batches/${createData.id}`, {
    headers: { 'Authorization': 'Bearer elx-live-master-free-hub' }
  });
  assert.strictEqual(getRes.status, 200);
  const getData = await getRes.json();
  assert.strictEqual(getData.id, createData.id);
  assert.ok(['in_progress', 'completed'].includes(getData.status));
});

test('HTTP: Webhooks REST API registers, lists, toggles, and deletes webhooks', async () => {
  // Create
  const addRes = await fetch(`${baseUrl}/api/webhooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://webhook.site/test-integration',
      events: 'failover,rate_limit'
    })
  });
  assert.strictEqual(addRes.status, 201);
  const addData = await addRes.json();
  assert.strictEqual(addData.success, true);
  assert.ok(addData.webhook.id);

  const whkId = addData.webhook.id;

  // List
  const listRes = await fetch(`${baseUrl}/api/webhooks`);
  assert.strictEqual(listRes.status, 200);
  const listData = await listRes.json();
  assert.ok(listData.webhooks.some(w => w.id === whkId));

  // Toggle
  const toggleRes = await fetch(`${baseUrl}/api/webhooks/${whkId}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: false })
  });
  assert.strictEqual(toggleRes.status, 200);

  // Delete
  const delRes = await fetch(`${baseUrl}/api/webhooks/${whkId}`, { method: 'DELETE' });
  assert.strictEqual(delRes.status, 200);
  const delData = await delRes.json();
  assert.strictEqual(delData.deleted, whkId);
});





