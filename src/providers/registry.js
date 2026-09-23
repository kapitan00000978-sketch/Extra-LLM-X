import { OpenRouterProvider } from './openrouter.js';
import { GroqProvider } from './groq.js';
import { GeminiProvider } from './gemini.js';
import { SambaNovaProvider } from './sambanova.js';
import { CerebrasProvider } from './cerebras.js';
import { GitHubModelsProvider } from './github_models.js';
import { MistralProvider } from './mistral.js';
import { HuggingFaceProvider } from './huggingface.js';
import { OllamaProvider } from './ollama.js';
import { KeyStore, ModelStore } from '../db/database.js';

export const ProviderPortals = [
  {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Ultra-Fast LPU',
    getKeyUrl: 'https://console.groq.com/keys',
    freeLimits: '30 req/min, 500+ tok/s free forever',
    popularModels: 'llama-3.3-70b-versatile, deepseek-r1-distill-llama-70b',
    keyPrefix: 'gsk_',
    keyPlaceholder: 'gsk_xxxxxxxxxxxxxxxxxxxxxxxx',
    helpText: 'Sign up with Google/GitHub, click "Create API Key", paste here.'
  },
  {
    id: 'gemini',
    name: 'Google AI Studio',
    badge: '1M+ Context Free',
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    freeLimits: '15 req/min, 1,500 req/day free forever',
    popularModels: 'gemini-2.0-flash, gemini-2.5-flash, gemini-1.5-pro',
    keyPrefix: 'AIzaSy',
    keyPlaceholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxx',
    helpText: 'Open Google AI Studio, click "Get API key" -> "Create API key in new project".'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter Free',
    badge: '30+ Free Models',
    getKeyUrl: 'https://openrouter.ai/keys',
    freeLimits: 'Access all models ending with :free for $0',
    popularModels: 'deepseek/deepseek-r1:free, llama-3.3-70b:free',
    keyPrefix: 'sk-or-',
    keyPlaceholder: 'sk-or-v1-xxxxxxxxxxxxxxxxxxxx',
    helpText: 'Sign in to OpenRouter, go to Keys -> Create Key (can be used with $0 credit for all free models).'
  },
  {
    id: 'sambanova',
    name: 'SambaNova Cloud',
    badge: 'SN40L High-Speed',
    getKeyUrl: 'https://cloud.sambanova.ai/apis',
    freeLimits: 'Generous free developer tier',
    popularModels: 'Meta-Llama-3.3-70B-Instruct, DeepSeek-R1',
    keyPrefix: '',
    keyPlaceholder: 'Paste SambaNova API Key',
    helpText: 'Register on SambaNova Cloud, navigate to APIs -> Create Key.'
  },
  {
    id: 'cerebras',
    name: 'Cerebras Cloud',
    badge: '2,000+ tok/s CS-3',
    getKeyUrl: 'https://cloud.cerebras.ai/',
    freeLimits: '30 req/min, 1M tokens/day free tier',
    popularModels: 'llama-3.3-70b, llama3.1-8b',
    keyPrefix: 'csk-',
    keyPlaceholder: 'csk-xxxxxxxxxxxxxxxxxxxx',
    helpText: 'Sign up on Cerebras Cloud, generate API Key under API Keys tab.'
  },
  {
    id: 'github',
    name: 'GitHub Models',
    badge: 'GPT-4o & Phi-4 Free',
    getKeyUrl: 'https://github.com/settings/tokens',
    freeLimits: '150 req/day free with any GitHub Account',
    popularModels: 'gpt-4o, Phi-4, Llama-3.3-70B',
    keyPrefix: 'ghp_',
    keyPlaceholder: 'ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_...',
    helpText: 'Generate GitHub Personal Access Token (classic or fine-grained) with read access.'
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    badge: 'Codestral Free',
    getKeyUrl: 'https://console.mistral.ai/api-keys/',
    freeLimits: 'Free developer tier for experimentation',
    popularModels: 'codestral-latest, mistral-small-latest',
    keyPrefix: '',
    keyPlaceholder: 'Paste Mistral API Key',
    helpText: 'Create free account on Mistral La Plateforme and generate API Key.'
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    badge: 'Serverless Free',
    getKeyUrl: 'https://huggingface.co/settings/tokens',
    freeLimits: 'Free Serverless Inference API with user token',
    popularModels: 'Qwen2.5-Coder-32B-Instruct, DeepSeek-R1-Qwen-32B',
    keyPrefix: 'hf_',
    keyPlaceholder: 'hf_xxxxxxxxxxxxxxxxxxxx',
    helpText: 'Create free User Access Token (Read) in Hugging Face settings.'
  },
  {
    id: 'ollama',
    name: 'Local Ollama',
    badge: '100% Offline & Free',
    getKeyUrl: 'https://ollama.com/',
    freeLimits: 'Unlimited, runs directly on your PC GPU/CPU',
    popularModels: 'llama3, deepseek-r1, qwen2.5-coder',
    keyPrefix: '',
    keyPlaceholder: 'No key needed (detects http://localhost:11434)',
    helpText: 'Run Ollama on your PC, Extra LLM X will auto-detect installed models.'
  }
];

class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.initProviders();
  }

  initProviders() {
    this.register(new OpenRouterProvider());
    this.register(new GroqProvider());
    this.register(new GeminiProvider());
    this.register(new SambaNovaProvider());
    this.register(new CerebrasProvider());
    this.register(new GitHubModelsProvider());
    this.register(new MistralProvider());
    this.register(new HuggingFaceProvider());
    this.register(new OllamaProvider());
  }

  register(provider) {
    this.providers.set(provider.name, provider);
  }

  get(name) {
    return this.providers.get(name);
  }

  getAll() {
    return Array.from(this.providers.values());
  }

  getPortals() {
    return ProviderPortals;
  }

  // Scan all providers for free models and update SQLite cache
  async scanAllProviders() {
    console.log('[Registry] Initiating full free-models scan across all providers...');
    let totalDiscovered = 0;

    for (const [providerName, provider] of this.providers.entries()) {
      try {
        // Check if there is an active key for this provider
        const keyRecord = KeyStore.getAvailableProviderKey(providerName);
        const apiKey = keyRecord ? keyRecord.api_key : null;

        // Perform model scan
        const models = await provider.scanModels(apiKey);
        if (models && models.length > 0) {
          for (const model of models) {
            ModelStore.upsertModel(model);
            totalDiscovered++;
          }
        }
      } catch (err) {
        console.warn(`[Registry] Error scanning provider ${providerName}: ${err.message}`);
      }
    }

    console.log(`[Registry] Scan completed. Successfully cached ${totalDiscovered} free model references.`);
    return totalDiscovered;
  }
}

export const registry = new ProviderRegistry();
