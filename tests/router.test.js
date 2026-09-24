import test from 'node:test';
import assert from 'node:assert';
import { routerEngine } from '../src/engine/router.js';
import { getAllCombos, getCombo } from '../src/engine/combos.js';
import { initDatabase } from '../src/db/database.js';

initDatabase();

test('Combos: all 5 standard combos are correctly defined with fallbacks', () => {
  const combos = getAllCombos();
  assert.strictEqual(combos.length, 5);

  const autoFree = getCombo('extra/auto-free');
  assert.ok(autoFree);
  assert.ok(autoFree.targets.length >= 6);

  const coding = getCombo('extra/free-coding');
  assert.ok(coding);
  assert.ok(coding.targets.some(t => t.provider === 'mistral'));

  const fast = getCombo('extra/free-fast');
  assert.ok(fast);
  assert.ok(fast.targets.some(t => t.provider === 'cerebras'));
});

test('RouterEngine: resolves plan for combos and prefixed models', () => {
  const planCombo = routerEngine.resolvePlan('extra/auto-free');
  assert.strictEqual(planCombo.combo, 'extra/auto-free');
  assert.ok(planCombo.targets.length > 0);

  const planPrefixed = routerEngine.resolvePlan('groq/llama-3.3-70b-versatile');
  assert.strictEqual(planPrefixed.targets[0].provider, 'groq');
  assert.strictEqual(planPrefixed.targets[0].model, 'llama-3.3-70b-versatile');
});

test('RouterEngine: executes demo fallback when no external keys are present', async () => {
  const result = await routerEngine.dispatch({
    clientKey: 'test-client-key',
    requestedModel: 'extra/auto-free',
    messages: [{ role: 'user', content: 'Testing router dispatch' }],
    stream: false
  });

  assert.ok(result.response);
  const data = await result.response.json();
  assert.ok(data.choices && data.choices.length > 0);
  assert.ok(data.choices[0].message.content.includes('Extra LLM X'));
});
