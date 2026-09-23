import { registry } from '../providers/registry.js';
import { getCombo, VirtualCombos } from './combos.js';
import { KeyStore, ModelStore, LogStore } from '../db/database.js';

export class Dispatcher {
  /**
   * Resolve a requested model string into a prioritized list of executable targets:
   * Array of { provider: string, model: string }
   */
  resolveExecutionPlan(requestedModel) {
    const model = (requestedModel || 'extra/auto-free').trim();

    // Check virtual combos
    if (model === 'auto' || model === 'default' || model === 'extra/auto-free') {
      return { combo: 'extra/auto-free', targets: VirtualCombos['extra/auto-free'].targets };
    }
    const combo = getCombo(model);
    if (combo) {
      return { combo: model, targets: combo.targets };
    }

    // Check if model starts with a provider prefix: e.g. "groq/llama-3.3-70b-versatile"
    const slashIdx = model.indexOf('/');
    if (slashIdx !== -1) {
      const prefix = model.substring(0, slashIdx);
      const rest = model.substring(slashIdx + 1);
      
      // If provider exists in registry
      if (registry.get(prefix)) {
        return {
          combo: null,
          targets: [
            { provider: prefix, model: rest },
            // Add automatic fallback to auto-free if primary fails
            ...VirtualCombos['extra/auto-free'].targets.filter(t => t.provider !== prefix)
          ]
        };
      }
    }

    // If bare model name: search cached models to see which provider has it
    const allModels = ModelStore.getFreeModels();
    const match = allModels.find(m => m.model_id === model || m.id === model);
    if (match) {
      return {
        combo: null,
        targets: [
          { provider: match.provider, model: match.model_id },
          ...VirtualCombos['extra/auto-free'].targets.filter(t => t.provider !== match.provider)
        ]
      };
    }

    // Default fallback to auto-free combo
    return { combo: 'extra/auto-free', targets: VirtualCombos['extra/auto-free'].targets };
  }

  /**
   * Execute chat completion request with automatic multi-key rotation and multi-provider failover
   */
  async dispatch({ clientKey, requestedModel, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const startTime = Date.now();
    const plan = this.resolveExecutionPlan(requestedModel);
    let lastError = null;
    let fallbackOccurred = false;
    let actualModelUsed = null;
    let providerUsed = null;

    for (let i = 0; i < plan.targets.length; i++) {
      const target = plan.targets[i];
      const provider = registry.get(target.provider);
      if (!provider) continue;

      // Handle providers that don't need API keys (e.g. local Ollama)
      let keyRecord = null;
      let apiKey = null;

      if (target.provider === 'ollama') {
        apiKey = 'local';
      } else {
        keyRecord = KeyStore.getAvailableProviderKey(target.provider);
        if (!keyRecord) {
          // No active key for this provider, continue to next target
          continue;
        }
        apiKey = keyRecord.api_key;
      }

      try {
        if (i > 0) {
          fallbackOccurred = true;
          console.log(`[Dispatcher] Auto-failover triggered: Routing from failed provider to ${target.provider}/${target.model}`);
        }

        const res = await provider.complete({
          apiKey,
          model: target.model,
          messages,
          stream,
          temperature,
          max_tokens,
          tools,
          tool_choice
        });

        // Success! Touch key to update last used timestamp
        if (keyRecord) {
          KeyStore.touchProviderKey(keyRecord.id);
        }

        actualModelUsed = target.model;
        providerUsed = target.provider;

        return {
          response: res,
          provider: providerUsed,
          model: actualModelUsed,
          fallbackOccurred,
          startTime
        };
      } catch (err) {
        lastError = err;
        const status = err.status || 500;
        const { isRateLimit, isAuth } = provider.classifyError(err, status);

        console.warn(`[Dispatcher] Provider ${target.provider} failed for ${target.model}: ${err.message}`);

        if (keyRecord) {
          if (isRateLimit) {
            console.warn(`[Dispatcher] Rate limit (429) hit on ${target.provider}. Cooldown 60s applied.`);
            KeyStore.markKeyCooldown(keyRecord.id, 60);
          } else if (isAuth) {
            console.warn(`[Dispatcher] Auth error (401/403) on ${target.provider}. Pausing key.`);
            KeyStore.markKeyCooldown(keyRecord.id, 3600);
          } else {
            // General temporary glitch, brief cooldown
            KeyStore.markKeyCooldown(keyRecord.id, 15);
          }
        }

        // Try next candidate target in the fallback chain!
        continue;
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
      errorMessage: lastError ? lastError.message : 'No active free provider keys available'
    });

    const errorMsg = lastError
      ? `All free providers failed. Last error: ${lastError.message}`
      : `No active provider keys found. Please add a free API key for Groq, Google Gemini, OpenRouter, or SambaNova in the Extra LLM X dashboard at http://localhost:3000`;

    const customErr = new Error(errorMsg);
    customErr.status = 503;
    throw customErr;
  }
}

export const dispatcher = new Dispatcher();
