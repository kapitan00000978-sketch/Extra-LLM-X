import { adapterRegistry } from '../adapters/index.js';
import { getCombo, VirtualCombos } from './combos.js';
import { KeyStore, ModelStore, LogStore } from '../db/database.js';
import { lockoutPolicy } from './lockout.js';
import { promptCompression } from './compression.js';
import { responseCache } from './cache.js';
import { speculativeHedging } from './hedging.js';
import { webhookEngine } from './webhooks.js';
import { config } from '../config.js';

export class RouterEngine {
  detectRequirements(messages = [], tools = []) {
    let hasVision = false;
    let totalChars = 0;

    for (const m of messages) {
      if (Array.isArray(m.content)) {
        for (const part of m.content) {
          if (part.type === 'image_url' || part.image_url || part.type === 'image') {
            hasVision = true;
          }
          if (typeof part.text === 'string') {
            totalChars += part.text.length;
          }
        }
      } else if (typeof m.content === 'string') {
        totalChars += m.content.length;
      }
    }

    const estimatedTokens = Math.max(1, Math.round(totalChars / 3.8));
    const hasTools = Boolean(tools && Array.isArray(tools) && tools.length > 0);

    return { hasVision, hasTools, estimatedTokens };
  }

  resolvePlan(requestedModel, requirements = {}) {
    const { hasVision, hasTools, estimatedTokens = 0 } = requirements;
    const model = (requestedModel || 'extra/auto-free').trim();

    let baseTargets = [];
    let comboName = null;

    if (hasVision && (model === 'auto' || model === 'default' || model === 'extra/auto-free')) {
      return { combo: 'extra/free-vision', targets: VirtualCombos['extra/free-vision'].targets };
    }

    if (model === 'auto' || model === 'default' || model === 'extra/auto-free') {
      baseTargets = VirtualCombos['extra/auto-free'].targets;
      comboName = 'extra/auto-free';
    } else {
      const combo = getCombo(model);
      if (combo) {
        baseTargets = combo.targets;
        comboName = model;
      } else {
        const slashIdx = model.indexOf('/');
        if (slashIdx !== -1) {
          const prefix = model.substring(0, slashIdx);
          const rest = model.substring(slashIdx + 1);

          if (adapterRegistry.get(prefix)) {
            baseTargets = [
              { provider: prefix, model: rest },
              ...VirtualCombos['extra/auto-free'].targets.filter(t => t.provider !== prefix)
            ];
          }
        }

        if (baseTargets.length === 0) {
          const freeModels = ModelStore.getFreeModels();
          const match = freeModels.find(m => m.model_id === model || m.id === model);
          if (match) {
            baseTargets = [
              { provider: match.provider, model: match.model_id },
              ...VirtualCombos['extra/auto-free'].targets.filter(t => t.provider !== match.provider)
            ];
          } else {
            baseTargets = VirtualCombos['extra/auto-free'].targets;
            comboName = 'extra/auto-free';
          }
        }
      }
    }

    // Apply Capability & Context Guards
    let filtered = [...baseTargets];

    if (hasVision) {
      const visionProviders = new Set(['gemini', 'openrouter', 'github', 'sambanova', 'pollinations', 'mock']);
      filtered = filtered.filter(t => visionProviders.has(t.provider));
      if (filtered.length === 0) filtered = VirtualCombos['extra/free-vision'].targets;
    }

    if (hasTools) {
      // Prioritize providers known for reliable tool/function calling support
      const toolOrder = ['groq', 'gemini', 'sambanova', 'cerebras', 'mistral', 'nvidia', 'deepseek', 'github', 'mock'];
      filtered.sort((a, b) => {
        const idxA = toolOrder.indexOf(a.provider);
        const idxB = toolOrder.indexOf(b.provider);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
      });
    }

    return { combo: comboName, targets: filtered.length > 0 ? filtered : baseTargets };
  }

  async executeSingleTarget(target, activeMessages, stream, temperature, max_tokens, tools, tool_choice) {
    const targetId = `${target.provider}/${target.model}`;
    if (lockoutPolicy.isLocked(targetId)) {
      const lock = lockoutPolicy.getLockStatus(targetId);
      const err = new Error(`Target ${targetId} locked out (cooldown: ${Math.round(lock.remainingMs / 1000)}s)`);
      err.isLocked = true;
      throw err;
    }

    const adapter = adapterRegistry.get(target.provider);
    if (!adapter) throw new Error(`Adapter ${target.provider} not found`);

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
        const err = new Error(`No active API key for provider ${target.provider}`);
        err.isUnconfigured = true;
        throw err;
      }
      apiKey = keyRecord.api_key;
    }

    try {
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
      lockoutPolicy.recordSuccess(targetId);

      return {
        response: res,
        provider: target.provider,
        model: target.model
      };
    } catch (err) {
      lockoutPolicy.recordFailure(targetId);
      if (keyRecord) {
        const { isRateLimit, isAuth } = adapter.classifyError(err, err.status || 500);
        if (isRateLimit) {
          const cooldownSec = adapter.parseCooldownSeconds(err.headers, 60);
          console.warn(`[Router] Rate limit (429) hit on ${target.provider}. Cooling down key for ${cooldownSec}s.`);
          KeyStore.markKeyCooldown(keyRecord.id, cooldownSec);
          webhookEngine.dispatch('rate_limit', { provider: target.provider, cooldownSec }).catch(() => {});
        } else if (isAuth) {
          console.warn(`[Router] Auth failure (401/403) on ${target.provider}. Pausing key for 1h.`);
          KeyStore.markKeyCooldown(keyRecord.id, 3600);
        } else {
          KeyStore.markKeyCooldown(keyRecord.id, 15);
        }
      }
      throw err;
    }
  }

  async dispatch({ clientKey, requestedModel, messages, stream = false, temperature = 0.7, max_tokens, tools, tool_choice, compression = 'lite', skipCache = false }) {
    const startTime = Date.now();
    const requirements = this.detectRequirements(messages, tools);

    // Compute semantic cache hash for request
    const cacheHash = responseCache.computeHash({
      requestedModel,
      messages,
      temperature,
      max_tokens,
      tools
    });

    // Check Cache for non-streaming requests
    if (!stream && !skipCache) {
      const cached = responseCache.get(cacheHash);
      if (cached) {
        return {
          isCached: true,
          cachedData: cached.data,
          cacheHash,
          provider: 'cache',
          model: requestedModel,
          promptTokens: cached.promptTokens,
          completionTokens: cached.completionTokens,
          hitCount: cached.hitCount,
          fallbackOccurred: false,
          startTime,
          compression: { compressed: false, tokensSaved: 0 }
        };
      }
    }

    const plan = this.resolvePlan(requestedModel, requirements);
    let lastError = null;
    let fallbackOccurred = false;

    // Apply OmniRoute Prompt Compression
    const compressionResult = promptCompression.compressMessages(messages, compression);
    const activeMessages = compressionResult.messages;

    // Speculative Hedging for Non-Streaming Multi-Target Requests (OmniRoute / LiteLLM Enterprise Parity)
    if (!stream && config.enableHedging !== false && plan.targets.length >= 2) {
      const viable = [];
      for (const t of plan.targets) {
        const targetId = `${t.provider}/${t.model}`;
        if (lockoutPolicy.isLocked(targetId)) continue;
        const isNoAuth = t.provider === 'ollama' || t.provider === 'lmstudio' || t.provider === 'mock' || t.provider === 'opencode' || t.provider === 'pollinations';
        if (isNoAuth || KeyStore.getAvailableProviderKey(t.provider)) {
          viable.push(t);
          if (viable.length === 2) break;
        }
      }

      if (viable.length >= 2) {
        const [targetA, targetB] = viable;
        try {
          const hedgedResult = await speculativeHedging.executeHedged({
            primaryFn: () => this.executeSingleTarget(targetA, activeMessages, false, temperature, max_tokens, tools, tool_choice),
            fallbackFn: () => this.executeSingleTarget(targetB, activeMessages, false, temperature, max_tokens, tools, tool_choice),
            hedgeDelayMs: 4000,
            onPrimarySlow: () => {
              console.log(`[Router] Hedging: ${targetA.provider}/${targetA.model} taking >4s, triggering speculative race with ${targetB.provider}/${targetB.model}`);
            }
          });

          return {
            response: hedgedResult.response,
            provider: hedgedResult.provider,
            model: hedgedResult.model,
            fallbackOccurred: Boolean(hedgedResult.hedged),
            startTime,
            compression: compressionResult,
            cacheHash
          };
        } catch (hedgeErr) {
          lastError = hedgeErr;
        }
      }
    }

    // Sequential failover loop across combo targets
    for (let i = 0; i < plan.targets.length; i++) {
      const target = plan.targets[i];
      try {
        if (i > 0) {
          fallbackOccurred = true;
          console.log(`[Router] Failover routing to target ${i + 1}/${plan.targets.length}: ${target.provider}/${target.model}`);
          webhookEngine.dispatch('failover', {
            requestedModel,
            failedProvider: plan.targets[i - 1]?.provider,
            targetProvider: target.provider,
            targetModel: target.model
          }).catch(() => {});
        }

        const resObj = await this.executeSingleTarget(target, activeMessages, stream, temperature, max_tokens, tools, tool_choice);

        return {
          response: resObj.response,
          provider: resObj.provider,
          model: resObj.model,
          fallbackOccurred,
          startTime,
          compression: compressionResult,
          cacheHash
        };
      } catch (err) {
        if (err.isLocked || err.isUnconfigured) continue;
        lastError = err;
        console.warn(`[Router] ${target.provider}/${target.model} failed: ${err.message}`);
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
          compression: compressionResult,
          cacheHash
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
