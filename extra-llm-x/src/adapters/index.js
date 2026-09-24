import { OpenRouterAdapter } from './openrouter.js';
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
import { OllamaAdapter } from './ollama.js';
import { LMStudioAdapter } from './lmstudio.js';
import { MockDemoAdapter } from './mock.js';
import { KeyStore } from '../db/database.js';

class AdapterRegistry {
  constructor() {
    this.adapters = new Map();
    this.initDefaultAdapters();
  }

  initDefaultAdapters() {
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
    this.register(new OllamaAdapter());
    this.register(new LMStudioAdapter());
    this.register(new MockDemoAdapter());
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
      const isLocalOrMock = a.id === 'ollama' || a.id === 'lmstudio' || a.id === 'mock';

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
        configuredKeysCount: providerKeys.length,
        activeKeysCount: activeKeys.length,
        status: isLocalOrMock ? 'ready' : (activeKeys.length > 0 ? 'active' : 'unconfigured')
      };
    });
  }
}

export const adapterRegistry = new AdapterRegistry();
