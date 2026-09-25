import test from 'node:test';
import assert from 'node:assert';
import { adapterRegistry } from '../src/adapters/index.js';
import { getCombo } from '../src/engine/combos.js';

test('Paid & Frontier: OpenAI adapter registers, discovers models, and validates auth', async () => {
  const openai = adapterRegistry.get('openai');
  assert.ok(openai, 'OpenAI adapter must be registered');
  assert.strictEqual(openai.keyPrefix, 'sk-');

  const models = await openai.discoverModels();
  assert.ok(models.length >= 4);
  assert.ok(models.some(m => m.model_id === 'gpt-4o'));
  assert.ok(models.some(m => m.model_id === 'o3-mini'));

  await assert.rejects(
    async () => {
      await openai.executeChat({
        apiKey: '',
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'test' }]
      });
    },
    (err) => {
      assert.strictEqual(err.status, 401);
      return true;
    }
  );
});

test('Paid & Frontier: Anthropic adapter registers, formats messages, and translates schema', async () => {
  const anthropic = adapterRegistry.get('anthropic');
  assert.ok(anthropic, 'Anthropic adapter must be registered');
  assert.strictEqual(anthropic.keyPrefix, 'sk-ant-');

  const models = await anthropic.discoverModels();
  assert.ok(models.length >= 3);
  assert.ok(models.some(m => m.model_id.includes('claude-3-7-sonnet')));

  // Check message formatting
  const inputMessages = [
    { role: 'system', content: 'You are helpful.' },
    { role: 'user', content: 'Hello' },
    { role: 'user', content: 'Are you there?' }
  ];
  const { system, messages } = anthropic.formatMessagesForAnthropic(inputMessages);
  assert.strictEqual(system, 'You are helpful.');
  assert.strictEqual(messages.length, 1);
  assert.strictEqual(messages[0].role, 'user');
  assert.ok(messages[0].content.includes('Hello'));
  assert.ok(messages[0].content.includes('Are you there?'));

  await assert.rejects(
    async () => {
      await anthropic.executeChat({
        apiKey: '',
        model: 'anthropic/claude-3-7-sonnet',
        messages: inputMessages
      });
    },
    (err) => {
      assert.strictEqual(err.status, 401);
      return true;
    }
  );
});

test('Paid & Frontier: Kilo & Puter proxy frontier models with zero-key and BYOK support', async () => {
  const kilo = adapterRegistry.get('kilo');
  const kiloModels = await kilo.discoverModels();
  assert.ok(kiloModels.some(m => m.model_id === 'claude-3-7-sonnet'));
  assert.ok(kiloModels.some(m => m.model_id === 'gpt-4o'));
  assert.ok(kiloModels.some(m => m.model_id === 'o3-mini'));

  const puter = adapterRegistry.get('puter');
  const puterModels = await puter.discoverModels();
  assert.ok(puterModels.some(m => m.model_id === 'claude-3-7-sonnet'));
  assert.ok(puterModels.some(m => m.model_id === 'gpt-4o'));
  assert.ok(puterModels.some(m => m.model_id === 'o3-mini'));
});

test('Paid & Frontier: Virtual Combo extra/frontier routes with #frontier and #paid aliases', () => {
  const frontierCombo = getCombo('extra/frontier');
  assert.ok(frontierCombo, 'extra/frontier combo must exist');
  assert.ok(frontierCombo.targets.length >= 8);
  assert.ok(frontierCombo.targets.some(t => t.provider === 'anthropic'));
  assert.ok(frontierCombo.targets.some(t => t.provider === 'openai'));
  assert.ok(frontierCombo.targets.some(t => t.provider === 'kilo'));
  assert.ok(frontierCombo.targets.some(t => t.provider === 'puter'));

  const byFrontierTag = getCombo('#frontier');
  assert.strictEqual(byFrontierTag.id, 'extra/frontier');

  const byPaidTag = getCombo('#paid');
  assert.strictEqual(byPaidTag.id, 'extra/frontier');
});
