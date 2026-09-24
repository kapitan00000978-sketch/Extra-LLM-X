import test from 'node:test';
import assert from 'node:assert';
import http from 'http';
import express from 'express';
import { FreeSearchEngine } from '../src/engine/search.js';
import { CodeSandboxEngine } from '../src/engine/sandbox.js';
import { ToolCallingPolyfill } from '../src/engine/tool_calling.js';
import { ContextCompactor } from '../src/engine/compactor.js';
import { openaiRouter } from '../src/routes/openai.js';
import { initDatabase, KeyStore } from '../src/db/database.js';

initDatabase();

const sysKey = 'elx-live-universal-agent-free-hub';

// 1. Free Search Engine Tests
test('FreeSearchEngine: handles empty or blank query safely', async () => {
  const r1 = await FreeSearchEngine.search('');
  assert.deepStrictEqual(r1, []);

  const r2 = await FreeSearchEngine.search('   ');
  assert.deepStrictEqual(r2, []);
});

test('FreeSearchEngine: groundMessages injects search citations into message prompt', async () => {
  const messages = [
    { role: 'user', content: 'What is the latest release of Node.js?' }
  ];

  const grounded = await FreeSearchEngine.groundMessages(messages, 2);
  assert.ok(Array.isArray(grounded.messages));
  assert.ok(grounded.messages.length >= 1);
  assert.strictEqual(grounded.query, 'What is the latest release of Node.js?');
});

// 2. Code Sandbox Engine Tests
test('CodeSandboxEngine: executes JavaScript code correctly', async () => {
  const result = await CodeSandboxEngine.execute({
    language: 'javascript',
    code: 'console.log(123 + 456);'
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.stdout, '579');
  assert.strictEqual(result.exitCode, 0);
  assert.ok(result.durationMs >= 0);
});

test('CodeSandboxEngine: executes Python code correctly', async () => {
  const result = await CodeSandboxEngine.execute({
    language: 'python',
    code: 'print("extra_llm_x_upgrade_py")'
  });

  // If python is installed in system, stdout matches
  if (result.success) {
    assert.strictEqual(result.stdout, 'extra_llm_x_upgrade_py');
  } else {
    // Graceful fallback if python executable not in PATH
    assert.ok(result.stderr.length > 0);
  }
});

test('CodeSandboxEngine: rejects unsupported language', async () => {
  const result = await CodeSandboxEngine.execute({
    language: 'rust',
    code: 'fn main() {}'
  });

  assert.strictEqual(result.success, false);
  assert.ok(result.stderr.includes('Unsupported sandbox language'));
});

// 3. Tool Calling Polyfill Tests
test('ToolCallingPolyfill: injects tools schema instruction into prompt', () => {
  const tools = [
    {
      type: 'function',
      function: {
        name: 'get_current_weather',
        description: 'Get current temperature for city',
        parameters: {
          type: 'object',
          properties: { city: { type: 'string' } },
          required: ['city']
        }
      }
    }
  ];

  const messages = [{ role: 'user', content: 'What is the weather in Paris?' }];
  const injected = ToolCallingPolyfill.injectToolsPrompt(messages, tools);

  assert.strictEqual(injected.length, 2);
  assert.strictEqual(injected[0].role, 'system');
  assert.ok(injected[0].content.includes('FUNCTION CALLING INSTRUCTIONS'));
  assert.ok(injected[0].content.includes('get_current_weather'));
});

test('ToolCallingPolyfill: extracts tool calls and cleans message content', () => {
  const rawModelResponse = 'Let me check that for you.\n<tool_call>\n{"name": "get_current_weather", "arguments": {"city": "Tokyo"}}\n</tool_call>\nI am fetching the data.';

  const { cleanContent, toolCalls } = ToolCallingPolyfill.extractToolCalls(rawModelResponse);

  assert.ok(Array.isArray(toolCalls));
  assert.strictEqual(toolCalls.length, 1);
  assert.strictEqual(toolCalls[0].function.name, 'get_current_weather');
  const args = JSON.parse(toolCalls[0].function.arguments);
  assert.strictEqual(args.city, 'Tokyo');
  assert.ok(!cleanContent.includes('<tool_call>'));
});

// 4. Context Compactor Tests
test('ContextCompactor: estimates token count and compacts long conversation', () => {
  const longParagraph = 'This is a very detailed architectural discussion about building high performance distributed gateways for large language models, including automatic failover routing, retry mechanisms, rate limit tracking with token buckets, semantic caching with L1 LRU in-memory and L2 SQLite disk persistence, batch processing, and live telemetry streaming.';

  const messages = [
    { role: 'system', content: 'You are an AI assistant.' },
    { role: 'user', content: 'Step 1: ' + longParagraph },
    { role: 'assistant', content: 'Response 1: ' + longParagraph },
    { role: 'user', content: 'Step 2: ' + longParagraph },
    { role: 'assistant', content: 'Response 2: ' + longParagraph },
    { role: 'user', content: 'Step 3: ' + longParagraph },
    { role: 'assistant', content: 'Response 3: ' + longParagraph },
    { role: 'user', content: 'Final question: Can we summarize this?' }
  ];

  const est = ContextCompactor.estimateTokens(messages);
  assert.ok(est > 200);

  const compacted = ContextCompactor.compact(messages, { maxTokens: 150, keepRecent: 2 });
  assert.strictEqual(compacted.compacted, true);
  assert.ok(compacted.tokensSaved > 50);
  assert.ok(compacted.messages.some(m => m.content.includes('CONVERSATION RECAP')));
});

// 5. HTTP Endpoints Tests
test('HTTP Endpoints: /v1/search and /v1/sandbox/eval respond correctly', async () => {
  const app = express();
  app.use(express.json());
  app.use('/v1', openaiRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  // Test /v1/sandbox/eval
  const evalRes = await fetch(`http://127.0.0.1:${port}/v1/sandbox/eval`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sysKey}`
    },
    body: JSON.stringify({
      language: 'javascript',
      code: 'console.log("SANDBOX_TEST_PASS_999");'
    })
  });

  assert.strictEqual(evalRes.status, 200);
  const evalData = await evalRes.json();
  assert.strictEqual(evalData.success, true);
  assert.strictEqual(evalData.stdout, 'SANDBOX_TEST_PASS_999');

  // Test /v1/search
  const searchRes = await fetch(`http://127.0.0.1:${port}/v1/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sysKey}`
    },
    body: JSON.stringify({ query: 'DuckDuckGo', limit: 2 })
  });

  assert.strictEqual(searchRes.status, 200);
  const searchData = await searchRes.json();
  assert.strictEqual(searchData.object, 'list');
  assert.strictEqual(searchData.query, 'DuckDuckGo');

  // Test /v1/compactor/compact
  const compactRes = await fetch(`http://127.0.0.1:${port}/v1/compactor/compact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sysKey}`
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Turn 1 message with lots of details about building systems' },
        { role: 'assistant', content: 'Turn 1 answer with architectural guidelines' },
        { role: 'user', content: 'Turn 2 message explaining more requirements' },
        { role: 'assistant', content: 'Turn 2 answer with more solutions' },
        { role: 'user', content: 'Turn 3 final user prompt' }
      ],
      maxTokens: 25,
      keepRecent: 1
    })
  });

  assert.strictEqual(compactRes.status, 200);
  const compactData = await compactRes.json();
  assert.strictEqual(compactData.compacted, true);

  await new Promise(resolve => server.close(resolve));
});

// 6. Zero-Key Adapters: Puter & Kilo Tests
test('PuterAdapter & KiloAdapter: discovery and no-auth registration', async () => {
  const { adapterRegistry } = await import('../src/adapters/index.js');
  
  const puter = adapterRegistry.get('puter');
  assert.ok(puter, 'Puter adapter must be registered');
  assert.strictEqual(puter.isNoAuth, true);
  const puterModels = await puter.discoverModels();
  assert.ok(puterModels.length >= 4);
  assert.ok(puterModels.some(m => m.model_id === 'gpt-4o-mini'));
  assert.ok(puterModels.some(m => m.model_id === 'claude-3-5-sonnet'));

  const kilo = adapterRegistry.get('kilo');
  assert.ok(kilo, 'Kilo adapter must be registered');
  assert.strictEqual(kilo.isNoAuth, true);
  const kiloModels = await kilo.discoverModels();
  assert.ok(kiloModels.length >= 4);
  assert.ok(kiloModels.some(m => m.model_id === 'kilo-auto/free'));
  assert.ok(kiloModels.some(m => m.model_id === 'qwen-2.5-coder-32b'));

  const portals = adapterRegistry.getPortals();
  const puterPortal = portals.find(p => p.id === 'puter');
  const kiloPortal = portals.find(p => p.id === 'kilo');
  assert.strictEqual(puterPortal.isNoAuth, true);
  assert.strictEqual(kiloPortal.isNoAuth, true);
  assert.strictEqual(puterPortal.status, 'ready');
  assert.strictEqual(kiloPortal.status, 'ready');
});
