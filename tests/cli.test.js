import test from 'node:test';
import assert from 'node:assert';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.resolve(__dirname, '../bin/extra-llm.js');

test('CLI: --version outputs version', async () => {
  const { stdout } = await execFileAsync(process.execPath, [cliPath, '--version']);
  assert.ok(stdout.includes('Extra LLM X v1.2.0'));
});

test('CLI: --help outputs banner and commands', async () => {
  const { stdout } = await execFileAsync(process.execPath, [cliPath, '--help']);
  assert.ok(stdout.includes('EXTRA LLM X CLI'));
  assert.ok(stdout.includes('Usage: extra-llm [command] [options]'));
  assert.ok(stdout.includes('start, serve'));
});

test('CLI: key new generates a valid random system key', async () => {
  const { stdout } = await execFileAsync(process.execPath, [cliPath, 'key', 'new', 'Test CLI Key']);
  assert.ok(stdout.includes('NEW API KEY GENERATED & ACTIVATED'));
  assert.ok(stdout.includes('elx-live-'));
});

test('CLI: combos prints virtual failover combos', async () => {
  const { stdout } = await execFileAsync(process.execPath, [cliPath, 'combos']);
  assert.ok(stdout.includes('Virtual Auto-Failover Combos'));
  assert.ok(stdout.includes('extra/frontier'));
  assert.ok(stdout.includes('extra/auto-free'));
});
