import { adapterRegistry } from '../adapters/index.js';
import { KeyStore, ModelStore } from '../db/database.js';
import { OMNIROUTE_FREE_MODELS } from '../catalog/omniroute_catalog.js';

export class DiscoveryEngine {
  async scanAll() {
    console.log('[DiscoveryEngine] Scanning all adapters for 100% free models...');
    let totalDiscovered = 0;

    // 1. Scan from active provider adapters
    for (const adapter of adapterRegistry.getAll()) {
      try {
        const keyRecord = KeyStore.getAvailableProviderKey(adapter.id);
        const apiKey = keyRecord ? keyRecord.api_key : null;

        const models = await adapter.discoverModels(apiKey);
        if (models && Array.isArray(models) && models.length > 0) {
          for (const model of models) {
            ModelStore.upsertModel(model);
            totalDiscovered++;
          }
        }
      } catch (err) {
        console.warn(`[DiscoveryEngine] Error scanning ${adapter.id}: ${err.message}`);
      }
    }

    // 2. Ingest OmniRoute Curated Free Model Catalog
    try {
      if (Array.isArray(OMNIROUTE_FREE_MODELS)) {
        for (const item of OMNIROUTE_FREE_MODELS) {
          ModelStore.upsertModel({
            id: `${item.provider}/${item.modelId}`,
            provider: item.provider,
            model_id: item.modelId,
            display_name: `${item.displayName} [${item.provider}]`,
            description: `OmniRoute Free Catalog (${item.freeType || 'free'}, pool: ${item.poolKey || 'general'})`,
            context_window: item.monthlyTokens > 1000000 ? 65536 : 16384,
            is_free: 1,
            capabilities: 'chat,general'
          });
          totalDiscovered++;
        }
      }
    } catch (catalogErr) {
      console.warn(`[DiscoveryEngine] Error ingesting OmniRoute catalog: ${catalogErr.message}`);
    }

    console.log(`[DiscoveryEngine] Completed scan: ${totalDiscovered} free models registered in SQLite.`);
    return totalDiscovered;
  }

  async scanProvider(providerId) {
    const adapter = adapterRegistry.get(providerId);
    if (!adapter) return 0;

    const keyRecord = KeyStore.getAvailableProviderKey(providerId);
    const apiKey = keyRecord ? keyRecord.api_key : null;

    const models = await adapter.discoverModels(apiKey);
    let count = 0;
    if (models && Array.isArray(models)) {
      for (const model of models) {
        ModelStore.upsertModel(model);
        count++;
      }
    }
    return count;
  }
}

export const discoveryEngine = new DiscoveryEngine();
