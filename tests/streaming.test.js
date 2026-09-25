import test from 'node:test';
import assert from 'node:assert';
import { MockDemoAdapter } from '../src/adapters/mock.js';

test('Streaming: MockDemoAdapter produces valid SSE chunks with data prefix and [DONE]', async () => {
  const mock = new MockDemoAdapter();
  const res = await mock.executeChat({
    apiKey: 'mock',
    model: 'extra-demo-model',
    messages: [{ role: 'user', content: 'Say hello in 3 words' }],
    stream: true
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('content-type'), 'text/event-stream; charset=utf-8');

  const text = await res.text();
  assert.ok(text.includes('data: '), 'Should contain SSE data frames');
  assert.ok(text.includes('data: [DONE]'), 'Should end with data: [DONE]');

  // Verify JSON parseability of individual chunks
  const lines = text.split('\n').filter(l => l.startsWith('data: ') && !l.includes('[DONE]'));
  assert.ok(lines.length > 0);

  const firstChunk = JSON.parse(lines[0].replace('data: ', ''));
  assert.strictEqual(firstChunk.object, 'chat.completion.chunk');
  assert.ok(firstChunk.choices && firstChunk.choices.length > 0);
  assert.ok(typeof firstChunk.choices[0].delta.content === 'string');
});

test('Non-Streaming: MockDemoAdapter produces OpenAI-compliant completion schema', async () => {
  const mock = new MockDemoAdapter();
  const res = await mock.executeChat({
    apiKey: 'mock',
    model: 'extra-demo-model',
    messages: [{ role: 'user', content: 'Testing non-stream payload' }],
    stream: false
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();

  assert.strictEqual(data.object, 'chat.completion');
  assert.ok(data.id.startsWith('chatcmpl-'));
  assert.ok(data.choices.length > 0);
  assert.strictEqual(data.choices[0].message.role, 'assistant');
  assert.ok(data.choices[0].message.content.length > 0);
  assert.ok(data.usage);
  assert.ok(data.usage.total_tokens > 0);
});

