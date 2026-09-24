import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { initDatabase, KeyStore, ModelStore } from './db/database.js';
import { discoveryEngine } from './engine/discovery.js';
import { healthCheckEngine } from './engine/health_check.js';
import { openaiRouter } from './routes/openai.js';
import { adminRouter } from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '..', 'public');

// Initialize SQLite database
initDatabase();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Web Dashboard
app.use(express.static(publicDir));

// Health check
app.get('/health', (req, res) => {
  const freeModels = ModelStore.getFreeModels();
  const providerKeys = KeyStore.getAllProviderKeys();
  res.json({
    status: 'ok',
    server: config.serverName,
    version: config.version,
    timestamp: new Date().toISOString(),
    activeFreeModels: freeModels.length,
    configuredProviders: providerKeys.filter(k => k.active === 1).length
  });
});

// Mount OpenAI Compatible Endpoints
app.use('/v1', openaiRouter);
app.use('/', openaiRouter);

// Mount Admin REST Endpoints
app.use('/api', adminRouter);

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/v1') || req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Launch Server
app.listen(config.port, config.host, async () => {
  console.log(`
  ==============================================================
   ███████╗██╗  ██╗████████╗██████╗  █████╗     ██╗     ██╗     ███╗   ███╗    ██╗  ██╗
   ██╔════╝╚██╗██╔╝╚══██╔══╝██╔══██╗██╔══██╗    ██║     ██║     ████╗ ████║    ╚██╗██╔╝
   █████╗   ╚███╔╝    ██║   ██████╔╝███████║    ██║     ██║     ██╔████╔██║     ╚███╔╝ 
   ██╔══╝   ██╔██╗    ██║   ██╔══██╗██╔══██║    ██║     ██║     ██║╚██╔╝██║     ██╔██╗ 
   ███████╗██╔╝ ██╗   ██║   ██║  ██║██║  ██║    ███████╗███████╗██║ ╚═╝ ██║    ██╔╝ ██╗
   ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝    ╚══════╝╚══════╝╚═╝     ╚═╝    ╚═╝  ╚═╝
  ==============================================================
   ⚡ EXTRA LLM X — 100% FREE AI GATEWAY FOR UNIVERSAL AGENT HP ⚡
  ==============================================================
   🚀 Dashboard UI       : http://localhost:${config.port}
   🔌 OpenAI API BaseURL : http://localhost:${config.port}/v1
   🔑 Default Client Key : elx-live-universal-agent-free-hub
   🤖 Universal Agent HP : Ready out-of-the-box!
  ==============================================================
  `);

  try {
    await discoveryEngine.scanAll();
    healthCheckEngine.startPeriodic(600000);
  } catch (err) {
    console.warn(`[Server] Initial scan warning: ${err.message}`);
  }
});
