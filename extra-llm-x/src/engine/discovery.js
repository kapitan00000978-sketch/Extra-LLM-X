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

    // 3. Dynamic Live Online Harvester (Scrapes $0 models without keys)
    try {
      const liveCount = await this.harvestOnlineFreeModels();
      totalDiscovered += liveCount;
    } catch (onlineErr) {
      // Graceful skip if offline
    }

    console.log(`[DiscoveryEngine] Completed scan: ${totalDiscovered} free models registered in SQLite.`);
    return totalDiscovered;
  }

  async harvestOnlineFreeModels() {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          let count = 0;
          for (const m of json.data) {
            const isZeroPrompt = m.pricing?.prompt === '0' || m.pricing?.prompt === 0;
            const isZeroComp = m.pricing?.completion === '0' || m.pricing?.completion === 0;
            const isFreeId = m.id && m.id.endsWith(':free');

            if (isFreeId || (isZeroPrompt && isZeroComp)) {
              ModelStore.upsertModel({
                id: `openrouter/${m.id}`,
                provider: 'openrouter',
                model_id: m.id,
                display_name: `${m.name || m.id} [OpenRouter Live Free]`,
                description: m.description || 'Live dynamic $0 free model from OpenRouter catalog',
                context_window: m.context_length || 32768,
                is_free: 1,
                capabilities: 'chat,general'
              });
              count++;
            }
          }
          return count;
        }
      }
    } catch (e) {
      // Offline fallback
    }
    return 0;
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
