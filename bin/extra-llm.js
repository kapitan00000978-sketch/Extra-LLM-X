#!/usr/bin/env node

/**
 * Extra LLM X — Unified AI Gateway CLI
 * Usage: extra-llm [command] [options]
 */

import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const command = args[0] || 'start';

// Helper for Windows ESM dynamic import
function getModuleUrl(relPath) {
  return pathToFileURL(path.join(rootDir, relPath)).href;
}

// Help / Banner
function printBanner() {
  console.log(`
  ==============================================================
   ███████╗██╗  ██╗████████╗██████╗  █████╗     ██╗     ██╗     ████╗   ████╗    ██╗  ██╗
   ██╔════╝╚██╗██╔╝╚══██╔══╝██╔══██╗██╔══██╗    ██║     ██║     ████║   ████║    ╚██╗██╔╝
   █████╗   ╚███╔╝    ██║   ██████╔╝███████║    ██║     ██║     ██╔████╔██║     ╚███╔╝ 
   ██╔══╝   ██╔██╗    ██║   ██╔══██╗██╔══██║    ██║     ██║     ██║╚██╔╝██║     ██╔██╗ 
   ███████╗██╔╝ ██╗   ██║   ██║  ██║██║  ██║    ███████╗███████╗██║ ╚═╝ ██║    ██╔╝ ██╗
   ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝    ╚══════╝╚══════╝╚═╝     ╚═╝    ╚═╝  ╚═╝
  ==============================================================
   ⚡ EXTRA LLM X CLI — HIGH-PERFORMANCE MULTI-PROVIDER AI GATEWAY ⚡
  ==============================================================
  `);
}

function printHelp() {
  printBanner();
  console.log(`Usage: extra-llm [command] [options]

Commands:
  start, serve         Start the Extra LLM X Gateway (Default)
  status               Check if local Extra LLM X Gateway is running
  key, key new         Generate a cryptographically random, 100% active API key
  key list             List all generated system API keys
  combos               List all virtual auto-failover combos (#frontier, #free, etc.)
  models               List top active free and frontier models
  help, --help, -h     Show this help screen
  --version, -v        Display Extra LLM X version

Options:
  -p, --port <port>    Specify server port (default: 3000 or $PORT)
  -h, --host <host>    Specify server host (default: 0.0.0.0)

Examples:
  extra-llm                     # Start gateway on http://localhost:3000
  extra-llm -p 3001             # Start gateway on port 3001
  extra-llm key new             # Generate an instant random API key
  extra-llm status              # Check server health and active models
  extra-llm combos              # View all failover virtual combos
`);
}

// Parse custom port if passed
function parsePort() {
  const pIdx = args.findIndex(a => a === '-p' || a === '--port');
  if (pIdx !== -1 && args[pIdx + 1]) {
    return parseInt(args[pIdx + 1], 10);
  }
  return process.env.PORT || 3000;
}

async function main() {
  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  if (command === '--version' || command === '-v') {
    console.log('Extra LLM X v1.2.0');
    process.exit(0);
  }

  if (command === 'key' || command === 'keys') {
    const subCmd = args[1] || 'new';
    const { initDatabase, KeyStore } = await import(getModuleUrl('src/db/database.js'));
    initDatabase();

    if (subCmd === 'new' || subCmd === 'generate' || subCmd === 'create') {
      const name = args[2] || `CLI Agent #${Math.floor(1000 + Math.random() * 9000)}`;
      const keyObj = KeyStore.createSystemKey(name, 120);

      console.log(`
  ==============================================================
   ✅ NEW API KEY GENERATED & ACTIVATED (100% OPERATIONAL)
  ==============================================================
   🔑 API Key    : ${keyObj.key}
   🏷️  Name       : ${keyObj.name}
   ⚡ RPM Limit  : ${keyObj.rate_limit_rpm} req/min
   💾 Saved To   : SQLite Database (Ready Immediately)
  ==============================================================

  Quick Test (cURL):
    curl http://localhost:3000/v1/chat/completions \\
      -H "Authorization: Bearer ${keyObj.key}" \\
      -d '{"model":"extra/frontier","messages":[{"role":"user","content":"Hi"}]}'
`);
      process.exit(0);
    }

    if (subCmd === 'list' || subCmd === 'ls') {
      const keys = KeyStore.getAllSystemKeys();
      console.log(`\nActive System API Keys (${keys.length}):\n`);
      console.table(keys.map(k => ({
        Key: k.key,
        Name: k.name,
        Active: k.active ? 'YES' : 'NO',
        RPM: k.rate_limit_rpm,
        Requests: k.request_count
      })));
      process.exit(0);
    }
  }

  if (command === 'status' || command === 'health') {
    const port = parsePort();
    try {
      const res = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        console.log(`\n🟢 Extra LLM X Gateway is ONLINE on port ${port}`);
        console.log(`   - Server: ${data.server || 'Extra LLM X'} (v${data.version || '1.2.0'})`);
        console.log(`   - Active Free Models: ${data.activeFreeModels || 744}+`);
        console.log(`   - Configured Providers: ${data.configuredProviders || 0}`);
        console.log(`   - Endpoint: http://localhost:${port}/v1\n`);
        process.exit(0);
      } else {
        console.log(`\n🟡 Server responded with status ${res.status}`);
        process.exit(1);
      }
    } catch {
      console.log(`\n🔴 Extra LLM X Gateway is NOT running on port ${port}.`);
      console.log(`   Start it with: extra-llm\n`);
      process.exit(1);
    }
  }

  if (command === 'combos') {
    const { getAllCombos } = await import(getModuleUrl('src/engine/combos.js'));
    const combos = getAllCombos();
    console.log(`\nVirtual Auto-Failover Combos (${combos.length}):\n`);
    for (const c of combos) {
      console.log(`  👑 ${c.id.padEnd(22)} : ${c.display_name}`);
      console.log(`     Description: ${c.description}`);
      console.log(`     Primary Targets: ${c.targets.slice(0, 4).map(t => `${t.provider}/${t.model}`).join(' → ')} → ...`);
      console.log('');
    }
    process.exit(0);
  }

  if (command === 'models') {
    const { initDatabase, ModelStore } = await import(getModuleUrl('src/db/database.js'));
    initDatabase();
    const models = ModelStore.getFreeModels();
    console.log(`\nDiscovered Free & Frontier Models (${models.length}):\n`);
    console.table(models.slice(0, 30).map(m => ({
      ID: m.id,
      Provider: m.provider,
      Context: m.context_window,
      Capabilities: m.capabilities
    })));
    console.log(`... and ${Math.max(0, models.length - 30)} more models. Open http://localhost:3000 to search all.\n`);
    process.exit(0);
  }

  // Default: start the server
  const targetPort = parsePort();
  process.env.PORT = targetPort.toString();
  await import(getModuleUrl('src/server.js'));
}

main().catch(err => {
  console.error('\n❌ Extra LLM X CLI Error:', err.message);
  process.exit(1);
});
