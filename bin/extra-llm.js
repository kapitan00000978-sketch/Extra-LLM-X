#!/usr/bin/env node

/**
 * Extra LLM X - Unified AI Gateway CLI
 * Usage: extra-llm [command] [options]
 */

import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
let command = (args[0] || 'start').toLowerCase();

// Support "extra llm", "extra run", "extra up", "extra serve" as start alias
if (command === 'llm' || command === 'run' || command === 'up' || command === 'serve') {
  command = 'start';
}

// Helper for Windows ESM dynamic import
function getModuleUrl(relPath) {
  return pathToFileURL(path.join(rootDir, relPath)).href;
}

// Help / Banner
function printBanner() {
  console.log(`
  ==============================================================
   ⚡ EXTRA LLM X CLI — ZERO-COST MULTI-PROVIDER AI GATEWAY ⚡
  ==============================================================
  `);
}

function printHelp() {
  printBanner();
  console.log(`Usage: extra-llm [command] [options]
       extra [command] [options]

Commands:
  start, serve         Start the Extra LLM X Gateway (Default: port 3000)
  restart              Stop previous instance on port and restart fresh
  stop                 Stop the server and release port 3000
  status, health       Check if Extra LLM X Gateway is running and view stats
  open, ui             Open Web Control Hub in default browser (http://localhost:3000)
  key new [label]      Generate a cryptographically random, 100% active API key (elx-...)
  key list             List all generated system API keys and usage
  combos               List all virtual auto-failover combos (#frontier, #free, etc.)
  models               List top active free and frontier models
  help, --help, -h     Show this help screen
  --version, -v        Display Extra LLM X version

Options:
  -p, --port <port>    Specify server port (default: 3000 or $PORT)

Examples:
  extra-llm                     # Start gateway on http://localhost:3000
  extra                         # Short alias to start gateway
  extra-llm restart             # Clear port and restart cleanly
  extra-llm stop                # Stop running server
  extra-llm key new "my-app"    # Generate an instant random API key
  extra-llm status              # Check server health and active models
  extra open                    # Open web dashboard in browser
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

// Kill process on port (Cross-platform)
function killPort(port) {
  try {
    if (process.platform === 'win32') {
      execSync(`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' });
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
    }
  } catch {
    // ignore
  }
}

// Check if server is already running on port
async function isServerRunning(port) {
  try {
    const res = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
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

  const targetPort = parsePort();

  if (command === 'stop') {
    console.log(`🛑 Extra LLM X server to'xtatilmoqda (port ${targetPort})...`);
    killPort(targetPort);
    console.log(`✅ Port ${targetPort} muvaffaqiyatli bo'shatildi.\n`);
    process.exit(0);
  }

  if (command === 'restart') {
    console.log(`🔄 Extra LLM X qayta ishga tushirilmoqda (port ${targetPort})...`);
    killPort(targetPort);
    await new Promise(r => setTimeout(r, 1200));
    process.env.PORT = targetPort.toString();
    await import(getModuleUrl('src/server.js'));
    return;
  }

  if (command === 'open' || command === 'ui') {
    const url = `http://localhost:${targetPort}`;
    console.log(`🌐 Brauzerda ochilmoqda: ${url}`);
    if (process.platform === 'win32') {
      execSync(`start ${url}`);
    } else if (process.platform === 'darwin') {
      execSync(`open ${url}`);
    } else {
      execSync(`xdg-open ${url}`);
    }
    process.exit(0);
  }

  if (command === 'key' || command === 'keys') {
    const subCmd = (args[1] || 'new').toLowerCase();
    const { initDatabase, KeyStore } = await import(getModuleUrl('src/db/database.js'));
    initDatabase();

    if (subCmd === 'new' || subCmd === 'generate' || subCmd === 'create') {
      const name = args[2] || `Agent #${Math.floor(1000 + Math.random() * 9000)}`;
      const keyObj = KeyStore.createSystemKey(name, 120);

      console.log(`
  ==============================================================
   🔑 NEW API KEY GENERATED & ACTIVATED (100% OPERATIONAL)
  ==============================================================
   🔑 API Key    : ${keyObj.key}
   🏷️  Name/Label : ${keyObj.name}
   ⚡ RPM Limit  : ${keyObj.rate_limit_rpm} req/min
   💾 Saved To   : SQLite Database (Ready Immediately)
  ==============================================================

  Foydalanish (OpenAI / Cursor / Claude Code):
    Base URL : http://localhost:${targetPort}/v1
    API Key  : ${keyObj.key}
    Model ID : extra/auto-free (yoki extra/frontier, extra/free-coding)
`);
      process.exit(0);
    }

    if (subCmd === 'list' || subCmd === 'ls') {
      const keys = KeyStore.getAllSystemKeys();
      console.log(`\n📋 Aktiv Extra LLM X API Kalitlari (${keys.length} ta):\n`);
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
    try {
      const res = await fetch(`http://localhost:${targetPort}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        console.log(`\n🟢 Extra LLM X Gateway ONLAYN (Port: ${targetPort})`);
        console.log(`   - Server: ${data.server || 'Extra LLM X'} (v${data.version || '1.2.0'})`);
        console.log(`   - Faol Bepul Modellar: ${data.activeFreeModels || 744}+`);
        console.log(`   - Ulanish nuqtasi: http://localhost:${targetPort}/v1`);
        console.log(`   - Dashboard: http://localhost:${targetPort}/\n`);
        process.exit(0);
      } else {
        console.log(`\n⚠️ Server javob bermadi (Status: ${res.status})`);
        process.exit(1);
      }
    } catch {
      console.log(`\n🔴 Extra LLM X Gateway port ${targetPort} da ishlamayapti.`);
      console.log(`   Ishga tushirish uchun: extra-llm\n`);
      process.exit(1);
    }
  }

  if (command === 'combos') {
    const { getAllCombos } = await import(getModuleUrl('src/engine/combos.js'));
    const combos = getAllCombos();
    console.log(`\n🔀 Virtual Auto-Failover Combos (${combos.length} ta):\n`);
    for (const c of combos) {
      console.log(`  ⚡ ${c.id.padEnd(22)} : ${c.display_name}`);
      console.log(`     Description: ${c.description}`);
      console.log(`     Targets: ${c.targets.slice(0, 4).map(t => `${t.provider}/${t.model}`).join('   ')}   ...`);
      console.log('');
    }
    process.exit(0);
  }

  if (command === 'models') {
    const { initDatabase, ModelStore } = await import(getModuleUrl('src/db/database.js'));
    initDatabase();
    const models = ModelStore.getFreeModels();
    console.log(`\n🤖 Bepul va Frontier Modellar (${models.length} ta):\n`);
    console.table(models.slice(0, 30).map(m => ({
      ID: m.id,
      Provider: m.provider,
      Context: m.context_window,
      Capabilities: m.capabilities
    })));
    console.log(`... va yana ${Math.max(0, models.length - 30)} ta model. Barchasini ko'rish: http://localhost:${targetPort}/\n`);
    process.exit(0);
  }

  // Default: start command
  // First check if already running on targetPort!
  const alreadyRunning = await isServerRunning(targetPort);
  if (alreadyRunning) {
    console.log(`
  ==============================================================
   🟢 Extra LLM X ALLAQACHON ISHLAB TURIBDI (Port: ${targetPort})
  ==============================================================
   🌐 Web Control Hub  : http://localhost:${targetPort}
   📡 OpenAI API       : http://localhost:${targetPort}/v1
   🔑 Master API Kalit : elx-live-master-free-hub
   
   💡 Foydali buyruqlar:
      extra open         -> Brauzerda boshqaruv panelini ochish
      extra-llm restart  -> Qayta toza ishga tushirish
      extra-llm stop     -> Serverni to'xtatish
      extra-llm key new  -> Yangi API kalit yaratish
  ==============================================================
`);
    process.exit(0);
  }

  // If not running, start server
  process.env.PORT = targetPort.toString();
  await import(getModuleUrl('src/server.js'));
}

main().catch(err => {
  console.error('\n❌ Extra LLM X CLI Xatosi:', err.message);
  process.exit(1);
});
