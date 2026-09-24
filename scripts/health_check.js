#!/usr/bin/env node

/**
 * Extra LLM X — Automated Health Check & Real-World Provider Verification CLI
 *
 * Runs comprehensive live diagnostics against all 26+ free AI provider adapters.
 * Verifies live endpoint connectivity, latency, and authentication.
 */

import { adapterRegistry } from '../src/adapters/index.js';
import { healthCheckEngine } from '../src/engine/health_check.js';
import { KeyStore, HealthStore, initDatabase } from '../src/db/database.js';
import dotenv from 'dotenv';

dotenv.config();
initDatabase();

// Check if any keys are in .env and auto-register them for testing
const ENV_KEY_MAP = {
  groq: process.env.GROQ_API_KEY,
  gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  openrouter: process.env.OPENROUTER_API_KEY,
  cerebras: process.env.CEREBRAS_API_KEY,
  sambanova: process.env.SAMBANOVA_API_KEY,
  github: process.env.GITHUB_TOKEN || process.env.GITHUB_MODELS_PAT,
  mistral: process.env.MISTRAL_API_KEY,
  deepseek: process.env.DEEPSEEK_API_KEY,
  together: process.env.TOGETHER_API_KEY,
  fireworks: process.env.FIREWORKS_API_KEY,
  huggingface: process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN
};

for (const [provider, key] of Object.entries(ENV_KEY_MAP)) {
  if (key && key.trim()) {
    const existing = KeyStore.getAvailableProviderKey(provider);
    if (!existing) {
      KeyStore.addProviderKey(provider, key.trim(), `Auto-loaded from .env (${provider})`);
    }
  }
}

console.log('\n==============================================================');
console.log(' ⚡ EXTRA LLM X — COMPREHENSIVE PROVIDER HEALTH DIAGNOSTICS ⚡');
console.log('==============================================================\n');

async function runCliDiagnostics() {
  const adapters = adapterRegistry.getAll();
  console.log(`Auditing ${adapters.length} connected AI provider adapters...\n`);

  const results = [];

  for (const adapter of adapters) {
    const startTime = Date.now();
    try {
      const res = await healthCheckEngine.checkProvider(adapter.id);
      results.push({
        id: adapter.id,
        name: adapter.name,
        badge: adapter.badge || 'Free Tier',
        status: res.status,
        latency: res.latency_ms > 0 ? `${res.latency_ms}ms` : '-',
        error: res.error || null
      });
    } catch (err) {
      results.push({
        id: adapter.id,
        name: adapter.name,
        badge: adapter.badge || 'Free Tier',
        status: 'error',
        latency: `${Date.now() - startTime}ms`,
        error: err.message
      });
    }
  }

  // Display Table
  console.log('| Provider               | Status         | Latency   | Tier Limits / Badge     |');
  console.log('|------------------------|----------------|-----------|-------------------------|');

  for (const r of results) {
    let statusIcon = '⚪';
    if (r.status === 'healthy') statusIcon = '🟢';
    else if (r.status === 'degraded') statusIcon = '🟡';
    else if (r.status === 'offline') statusIcon = '🔴';
    else if (r.status === 'unconfigured') statusIcon = '⚪';

    const statusStr = `${statusIcon} ${r.status}`.padEnd(14);
    const nameStr = r.name.slice(0, 22).padEnd(22);
    const latStr = r.latency.padEnd(9);
    const badgeStr = r.badge.slice(0, 23).padEnd(23);

    console.log(`| ${nameStr} | ${statusStr} | ${latStr} | ${badgeStr} |`);
  }

  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const unconfiguredCount = results.filter(r => r.status === 'unconfigured').length;

  console.log('\n--------------------------------------------------------------');
  console.log(`Summary: ${healthyCount} Healthy / Online | ${unconfiguredCount} Standby (Key Needed) | ${results.length} Total`);
  console.log('--------------------------------------------------------------\n');

  console.log('💡 TIP: To activate Groq, Gemini, OpenRouter, Cerebras free tiers:');
  console.log('   1. Get your free key at:');
  console.log('      - Groq       : https://console.groq.com/keys');
  console.log('      - Gemini     : https://aistudio.google.com/app/apikey');
  console.log('      - OpenRouter : https://openrouter.ai/keys');
  console.log('      - Cerebras   : https://cloud.cerebras.ai');
  console.log('   2. Add keys to .env (GROQ_API_KEY=gsk_...) or via UI at http://localhost:3000\n');
}

runCliDiagnostics().catch(console.error);
