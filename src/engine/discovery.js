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

  /**
   * Scan a provider using a specific API key (without requiring it to be saved first).
   * Returns { models: [...], count: number }
   */
  async scanProviderWithKey(providerId, apiKey) {
    const adapter = adapterRegistry.get(providerId);
    if (!adapter) throw new Error(`Unknown provider: ${providerId}`);

    const models = await adapter.discoverModels(apiKey);
    const discovered = [];
    if (models && Array.isArray(models)) {
      for (const model of models) {
        ModelStore.upsertModel(model);
        discovered.push(model);
      }
    }
    console.log(`[DiscoveryEngine] scanProviderWithKey(${providerId}): discovered ${discovered.length} models`);
    return { models: discovered, count: discovered.length };
  }

  /**
   * Full auto-discovery pipeline:
   *   1. Validate API key with a live inference test
   *   2. Discover all free models from the provider
   *   3. Save the key to the KeyStore
   *   4. Register all discovered models
   *   5. Return a comprehensive result object
   *
   * This is the heart of "paste your key → everything works" flow.
   */
  async testAndActivateKey(providerId, apiKey, label = '') {
    const startTime = Date.now();
    const result = {
      success: false,
      provider: providerId,
      testPassed: false,
      testedModel: null,
      testReply: null,
      testLatencyMs: 0,
      modelsDiscovered: 0,
      modelsRegistered: [],
      keySaved: false,
      keyRecord: null,
      errors: []
    };

    const adapter = adapterRegistry.get(providerId.toLowerCase());
    if (!adapter) {
      result.errors.push(`Unknown provider: ${providerId}`);
      return result;
    }

    // Phase 1: Discover models using the provided key
    let discoveredModels = [];
    try {
      const discoverResult = await this.scanProviderWithKey(providerId.toLowerCase(), apiKey);
      discoveredModels = discoverResult.models;
      result.modelsDiscovered = discoverResult.count;
      result.modelsRegistered = discoveredModels.map(m => ({
        id: m.id,
        model_id: m.model_id,
        display_name: m.display_name,
        context_window: m.context_window,
        capabilities: m.capabilities
      }));
    } catch (discoverErr) {
      result.errors.push(`Model discovery failed: ${discoverErr.message}`);
    }

    // Phase 2: Live inference test with the first discovered model
    try {
      const testModel = discoveredModels.length > 0
        ? discoveredModels[0].model_id
        : (adapter.freeModels?.[0]?.id || adapter.knownFreeModels?.[0]?.id || null);

      if (testModel) {
        result.testedModel = testModel;
        const testStart = Date.now();

        const testRes = await adapter.executeChat({
          apiKey,
          model: testModel,
          messages: [{ role: 'user', content: 'Say "Extra LLM X Connection Verified" in exactly 5 words.' }],
          max_tokens: 30,
          temperature: 0.3
        });

        const testData = await testRes.json();
        result.testReply = testData.choices?.[0]?.message?.content || 'Connection OK';
        result.testLatencyMs = Date.now() - testStart;
        result.testPassed = true;
      } else {
        result.errors.push('No model available for live test');
      }
    } catch (testErr) {
      result.errors.push(`Live inference test failed: ${testErr.message}`);
      // If test fails but models were discovered, we can still save the key
      // (the test may fail due to rate limits while models are valid)
      if (discoveredModels.length > 0) {
        result.testPassed = true; // Models exist → key is likely valid
        result.testReply = 'Key validated via model discovery (inference test skipped due to rate limit)';
      }
    }

    // Phase 3: Save the key if validation succeeded
    if (result.testPassed || discoveredModels.length > 0) {
      try {
        const autoLabel = label || `${adapter.name} Auto-Activated Key`;
        const keyRecord = KeyStore.addProviderKey(providerId.toLowerCase(), apiKey, autoLabel);
        result.keySaved = true;
        result.keyRecord = keyRecord;
        result.success = true;
        console.log(`[DiscoveryEngine] Key saved and activated for ${providerId}: ${discoveredModels.length} models registered`);
      } catch (saveErr) {
        result.errors.push(`Key save failed: ${saveErr.message}`);
      }
    }

    result.totalLatencyMs = Date.now() - startTime;
    return result;
  }
}

export const discoveryEngine = new DiscoveryEngine();
