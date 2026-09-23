import { adapterRegistry } from '../adapters/index.js';
import { getCombo, VirtualCombos } from './combos.js';
import { KeyStore, ModelStore, LogStore } from '../db/database.js';
import { config } from '../config.js';

export class RouterEngine {
  resolvePlan(requestedModel) {
    const model = (requestedModel || 'extra/auto-free').trim();

    if (model === 'auto' || model === 'default' || model === 'extra/auto-free') {
      return { combo: 'extra/auto-free', targets: VirtualCombos['extra/auto-free'].targets };
    }

    const combo = getCombo(model);
    if (combo) {
      return { combo: model, targets: combo.targets };
    }

    const slashIdx = model.indexOf('/');
    if (slashIdx !== -1) {
      const prefix = model.substring(0, slashIdx);
      const rest = model.substring(slashIdx + 1);

      if (adapterRegistry.get(prefix)) {
        return {
          combo: null,
          targets: [
            { provider: prefix, model: rest },
            ...VirtualCombos['extra/auto-free'].targets.filter(t => t.provider !== prefix)
          ]
        };
      }
    }

    const freeModels = ModelStore.getFreeModels();
    const match = freeModels.find(m => m.model_id === model || m.id === model);
    if (match) {
      return {
        combo: null,
        targets: [
          { provider: match.provider, model: match.model_id },
          ...VirtualCombos['extra/auto-free'].targets.filter(t => t.provider !== match.provider)
        ]
      };
    }

    return { combo: 'extra/auto-free', targets: VirtualCombos['extra/auto-free'].targets };
  }

  async dispatch({ clientKey, requestedModel, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const startTime = Date.now();
    const plan = this.resolvePlan(requestedModel);
    let lastError = null;
    let fallbackOccurred = false;

    for (let i = 0; i < plan.targets.length; i++) {
      const target = plan.targets[i];
      const adapter = adapterRegistry.get(target.provider);
      if (!adapter) continue;

      let keyRecord = null;
      let apiKey = null;

      const isLocalOrMock = target.provider === 'ollama' || target.provider === 'lmstudio' || target.provider === 'mock';

      if (isLocalOrMock) {
        apiKey = 'local';
      } else {
        keyRecord = KeyStore.getAvailableProviderKey(target.provider);
        if (!keyRecord) {
          // No active key for this provider, continue to next target in combo
          continue;
        }
        apiKey = keyRecord.api_key;
      }

      try {
        if (i > 0) {
          fallbackOccurred = true;
          console.log(`[Router] Failover routing to target ${i + 1}/${plan.targets.length}: ${target.provider}/${target.model}`);
        }

        const res = await adapter.executeChat({
          apiKey,
          model: target.model,
          messages,
          stream,
          temperature,
          max_tokens,
          tools,
          tool_choice
        });

        if (keyRecord) {
          KeyStore.touchProviderKey(keyRecord.id);
        }

        return {
          response: res,
          provider: target.provider,
          model: target.model,
          fallbackOccurred,
          startTime
        };
      } catch (err) {
        lastError = err;
        const status = err.status || 500;
        const { isRateLimit, isAuth } = adapter.classifyError(err, status);

        console.warn(`[Router] ${target.provider}/${target.model} failed: ${err.message}`);

        if (keyRecord) {
          if (isRateLimit) {
            console.warn(`[Router] Rate limit (429) hit on ${target.provider}. Cooling down key for 60s.`);
            KeyStore.markKeyCooldown(keyRecord.id, 60);
          } else if (isAuth) {
            console.warn(`[Router] Auth failure (401/403) on ${target.provider}. Pausing key.`);
            KeyStore.markKeyCooldown(keyRecord.id, 3600);
          } else {
            KeyStore.markKeyCooldown(keyRecord.id, 15);
          }
        }

        continue;
      }
    }

    // If all providers failed/unconfigured, check if demo fallback is permitted
    if (config.enableDemoFallback) {
      console.log('[Router] All providers unconfigured or failed, executing intelligent Demo Fallback...');
      const mockAdapter = adapterRegistry.get('mock');
      if (mockAdapter) {
        const res = await mockAdapter.executeChat({
          apiKey: 'mock',
          model: 'extra-demo-model',
          messages,
          stream,
          temperature,
          max_tokens
        });

        return {
          response: res,
          provider: 'mock-demo',
          model: 'extra-demo-model',
          fallbackOccurred: true,
          startTime
        };
      }
    }

    const latencyMs = Date.now() - startTime;
    LogStore.record({
      clientKey,
      requestedModel,
      actualModel: 'none',
      provider: 'none',
      latencyMs,
      statusCode: 503,
      fallbackOccurred: true,
      errorMessage: lastError ? lastError.message : 'No active provider keys available'
    });

    const errorMsg = lastError
      ? `All free providers in chain failed. Last error: ${lastError.message}`
      : `No active free provider keys found. Add keys for Groq, Gemini, OpenRouter, or SambaNova in the Extra LLM X dashboard at http://localhost:3000`;

    const err = new Error(errorMsg);
    err.status = 503;
    throw err;
  }
}

export const routerEngine = new RouterEngine();
