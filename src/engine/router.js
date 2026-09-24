import { adapterRegistry } from '../adapters/index.js';
import { getCombo, VirtualCombos } from './combos.js';
import { KeyStore, ModelStore, LogStore } from '../db/database.js';
import { lockoutPolicy } from './lockout.js';
import { promptCompression } from './compression.js';
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

  async dispatch({ clientKey, requestedModel, messages, stream = false, temperature, max_tokens, tools, tool_choice, compression = 'lite' }) {
    const startTime = Date.now();
    const plan = this.resolvePlan(requestedModel);
    let lastError = null;
    let fallbackOccurred = false;

    // Apply OmniRoute Prompt Compression
    const compressionResult = promptCompression.compressMessages(messages, compression);
    const activeMessages = compressionResult.messages;

    for (let i = 0; i < plan.targets.length; i++) {
      const target = plan.targets[i];
      const targetId = `${target.provider}/${target.model}`;

      // Check OmniRoute Circuit Breaker Lockout
      if (lockoutPolicy.isLocked(targetId)) {
        const lock = lockoutPolicy.getLockStatus(targetId);
        console.log(`[Router] Skipping locked-out target ${targetId} (cooldown: ${Math.round(lock.remainingMs / 1000)}s)`);
        continue;
      }

      const adapter = adapterRegistry.get(target.provider);
      if (!adapter) continue;

      let keyRecord = null;
      let apiKey = null;

      const isNoAuthOrLocal = target.provider === 'ollama' || 
                              target.provider === 'lmstudio' || 
                              target.provider === 'mock' ||
                              target.provider === 'opencode' ||
                              target.provider === 'pollinations';

      if (isNoAuthOrLocal) {
        apiKey = 'noauth';
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

        const res = await adapter.executeWithRetry(() => adapter.executeChat({
          apiKey,
          model: target.model,
          messages: activeMessages,
          stream,
          temperature,
          max_tokens,
          tools,
          tool_choice
        }), 1, 250);

        if (keyRecord) {
          KeyStore.touchProviderKey(keyRecord.id);
        }

        // OmniRoute Success: reset lockout
        lockoutPolicy.recordSuccess(targetId);

        return {
          response: res,
          provider: target.provider,
          model: target.model,
          fallbackOccurred,
          startTime,
          compression: compressionResult
        };
      } catch (err) {
        lastError = err;
        const status = err.status || 500;
        const { isRateLimit, isAuth } = adapter.classifyError(err, status);

        console.warn(`[Router] ${target.provider}/${target.model} failed: ${err.message}`);

        // Record failure in OmniRoute Circuit Breaker
        lockoutPolicy.recordFailure(targetId);

        if (keyRecord) {
          if (isRateLimit) {
            const cooldownSec = adapter.parseCooldownSeconds(err.headers, 60);
            console.warn(`[Router] Rate limit (429) hit on ${target.provider}. Cooling down key for ${cooldownSec}s.`);
            KeyStore.markKeyCooldown(keyRecord.id, cooldownSec);
          } else if (isAuth) {
            console.warn(`[Router] Auth failure (401/403) on ${target.provider}. Pausing key for 1h.`);
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
          messages: activeMessages,
          stream,
          temperature,
          max_tokens
        });

        return {
          response: res,
          provider: 'mock-demo',
          model: 'extra-demo-model',
          fallbackOccurred: true,
          startTime,
          compression: compressionResult
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
      : `No active free provider keys found. Add keys for Groq, Gemini, OpenRouter, DeepSeek, or SambaNova in the Extra LLM X dashboard at http://localhost:3000`;

    const err = new Error(errorMsg);
    err.status = 503;
    throw err;
  }
}

export const routerEngine = new RouterEngine();
