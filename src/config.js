import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  dataDir: path.join(rootDir, 'data'),
  dbPath: path.join(rootDir, 'data', 'extra_llm_x.db'),
  modelCacheTTL: parseInt(process.env.MODEL_CACHE_TTL || '3600000', 10),
  defaultTimeout: parseInt(process.env.REQUEST_TIMEOUT_MS || '60000', 10),
  enableAuth: process.env.ENABLE_AUTH !== 'false',
  masterKey: process.env.MASTER_KEY || 'elx-master-admin-key',
  enableDemoFallback: process.env.ENABLE_DEMO_FALLBACK !== 'false',
  serverName: 'Extra LLM X Free Gateway',
  version: '1.0.0',
  rootDir,
  publicDir: path.join(rootDir, 'public')
};
