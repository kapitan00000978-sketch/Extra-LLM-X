// Core & Extended Adapter Registry
import { PuterAdapter } from './puter.js';
import { KiloAdapter } from './kilo.js';
import { OpenRouterAdapter } from './openrouter.js';
import { OpenAIAdapter } from './openai.js';
import { AnthropicAdapter } from './anthropic.js';
import { GroqAdapter } from './groq.js';
import { GeminiAdapter } from './gemini.js';
import { CerebrasAdapter } from './cerebras.js';
import { SambaNovaAdapter } from './sambanova.js';
import { GitHubModelsAdapter } from './github_models.js';
import { MistralAdapter } from './mistral.js';
import { HuggingFaceAdapter } from './huggingface.js';
import { TogetherAdapter } from './together.js';
import { CloudflareAdapter } from './cloudflare.js';
import { FireworksAdapter } from './fireworks.js';
import { DeepInfraAdapter } from './deepinfra.js';
import { NovitaAdapter } from './novita.js';
import { CohereAdapter } from './cohere.js';
import { NvidiaNimAdapter } from './nvidia_nim.js';
import { SiliconFlowAdapter } from './siliconflow.js';
import { ZhipuAdapter } from './zhipu.js';
import { DeepSeekAdapter } from './deepseek.js';
import { HyperbolicAdapter } from './hyperbolic.js';
import { AimlApiAdapter } from './aimlapi.js';
import { ChutesAdapter } from './chutes.js';
import { OpenCodeAdapter } from './opencode.js';
import { PollinationsAdapter } from './pollinations.js';
import { OllamaAdapter } from './ollama.js';
import { LMStudioAdapter } from './lmstudio.js';
import { MockDemoAdapter } from './mock.js';

// 30 New Production Adapters
import { XaiAdapter } from './xai.js';
import { PerplexityAdapter } from './perplexity.js';
import { MoonshotAdapter } from './moonshot.js';
import { DashScopeAdapter } from './dashscope.js';
import { MiniMaxAdapter } from './minimax.js';
import { LingyiwanwuAdapter } from './lingyiwanwu.js';
import { StepFunAdapter } from './stepfun.js';
import { IflytekAdapter } from './iflytek.js';
import { VolcengineAdapter } from './volcengine.js';
import { QianfanAdapter } from './qianfan.js';
import { RekaAdapter } from './reka.js';
import { Ai21Adapter } from './ai21.js';
import { WriterAdapter } from './writer.js';
import { VoyageAdapter } from './voyage.js';
import { JinaAdapter } from './jina.js';
import { WatsonxAdapter } from './watsonx.js';
import { VertexAdapter } from './vertex.js';
import { NebiusAdapter } from './nebius.js';
import { ScalewayAdapter } from './scaleway.js';
import { OvhCloudAdapter } from './ovhcloud.js';
import { FriendliAdapter } from './friendli.js';
import { FeatherlessAdapter } from './featherless.js';
import { ReplicateAdapter } from './replicate.js';
import { BasetenAdapter } from './baseten.js';
import { SegmindAdapter } from './segmind.js';
import { NlpCloudAdapter } from './nlpcloud.js';
import { PoeAdapter } from './poe.js';
import { InferenceNetAdapter } from './inference_net.js';
import { GmiCloudAdapter } from './gmicloud.js';
import { LeptonAdapter } from './lepton.js';

import { KeyStore } from '../db/database.js';

class AdapterRegistry {
  constructor() {
    this.adapters = new Map();
    this.initDefaultAdapters();
  }

  initDefaultAdapters() {
    // Zero-Key Public Adapters & Paid Proxies
    this.register(new OpenCodeAdapter());
    this.register(new PuterAdapter());
    this.register(new KiloAdapter());
    this.register(new PollinationsAdapter());

    // Official Paid & BYOK Frontier Providers
    this.register(new OpenAIAdapter());
    this.register(new AnthropicAdapter());

    // Core LPU & Hyperscaler Providers
    this.register(new OpenRouterAdapter());
    this.register(new GroqAdapter());
    this.register(new GeminiAdapter());
    this.register(new CerebrasAdapter());
    this.register(new SambaNovaAdapter());
    this.register(new GitHubModelsAdapter());
    this.register(new MistralAdapter());
    this.register(new HuggingFaceAdapter());
    this.register(new TogetherAdapter());
    this.register(new CloudflareAdapter());
    this.register(new FireworksAdapter());
    this.register(new DeepInfraAdapter());
    this.register(new NovitaAdapter());
    this.register(new CohereAdapter());
    this.register(new NvidiaNimAdapter());
    this.register(new SiliconFlowAdapter());
    this.register(new ZhipuAdapter());
    this.register(new DeepSeekAdapter());
    this.register(new HyperbolicAdapter());
    this.register(new AimlApiAdapter());
    this.register(new ChutesAdapter());

    // Local Engines & Mock
    this.register(new OllamaAdapter());
    this.register(new LMStudioAdapter());
    this.register(new MockDemoAdapter());

    // 30 Extended Production Adapters
    this.register(new XaiAdapter());
    this.register(new PerplexityAdapter());
    this.register(new MoonshotAdapter());
    this.register(new DashScopeAdapter());
    this.register(new MiniMaxAdapter());
    this.register(new LingyiwanwuAdapter());
    this.register(new StepFunAdapter());
    this.register(new IflytekAdapter());
    this.register(new VolcengineAdapter());
    this.register(new QianfanAdapter());
    this.register(new RekaAdapter());
    this.register(new Ai21Adapter());
    this.register(new WriterAdapter());
    this.register(new VoyageAdapter());
    this.register(new JinaAdapter());
    this.register(new WatsonxAdapter());
    this.register(new VertexAdapter());
    this.register(new NebiusAdapter());
    this.register(new ScalewayAdapter());
    this.register(new OvhCloudAdapter());
    this.register(new FriendliAdapter());
    this.register(new FeatherlessAdapter());
    this.register(new ReplicateAdapter());
    this.register(new BasetenAdapter());
    this.register(new SegmindAdapter());
    this.register(new NlpCloudAdapter());
    this.register(new PoeAdapter());
    this.register(new InferenceNetAdapter());
    this.register(new GmiCloudAdapter());
    this.register(new LeptonAdapter());
  }

  register(adapter) {
    this.adapters.set(adapter.id, adapter);
  }

  get(id) {
    return this.adapters.get(id);
  }

  getAll() {
    return Array.from(this.adapters.values());
  }

  getPortals() {
    const keys = KeyStore.getAllProviderKeys();
    return this.getAll().map(a => {
      const providerKeys = keys.filter(k => k.provider === a.id);
      const activeKeys = providerKeys.filter(k => k.active === 1);
      const isNoAuth = a.id === 'ollama' || a.id === 'lmstudio' || a.id === 'mock' || a.id === 'opencode' || a.id === 'pollinations' || a.id === 'puter' || a.id === 'kilo';

      return {
        id: a.id,
        name: a.name,
        badge: a.badge,
        getKeyUrl: a.getKeyUrl,
        guide: a.guide,
        freeTierInfo: a.freeTierInfo,
        popularModels: a.popularModels,
        keyPrefix: a.keyPrefix,
        keyPlaceholder: a.keyPlaceholder,
        isNoAuth,
        hasKey: activeKeys.length > 0,
        status: isNoAuth ? 'ready' : (activeKeys.length > 0 ? 'configured' : 'unconfigured'),
        keys: providerKeys.map(k => ({
          id: k.id,
          label: k.label,
          active: k.active,
          cooldownUntil: k.cooldown_until,
          errorCount: k.error_count
        }))
      };
    });
  }
}

export const adapterRegistry = new AdapterRegistry();
