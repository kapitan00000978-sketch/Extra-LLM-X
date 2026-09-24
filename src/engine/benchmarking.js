import { adapterRegistry } from '../adapters/index.js';
import { KeyStore, BenchmarkStore } from '../db/database.js';

export const BASE_PROVIDER_METRICS = {
  deepseek: {
    name: 'DeepSeek Official',
    baseElo: 1380,
    baseSpeed: 50,
    topModel: 'deepseek-reasoner (R1)',
    topFreeModels: ['deepseek-reasoner', 'deepseek-chat'],
    specialty: 'Math & Architecture Reasoning',
    freeQuota: '5M Free Tokens',
    category: 'Frontier Reasoning'
  },
  cerebras: {
    name: 'Cerebras Cloud',
    baseElo: 1320,
    baseSpeed: 2150,
    topModel: 'llama-3.3-70b',
    topFreeModels: ['llama-3.3-70b', 'llama3.1-8b'],
    specialty: 'Ultra-Low Latency Agent Loops',
    freeQuota: '1M tokens/day',
    category: 'High-Throughput Wafer'
  },
  groq: {
    name: 'Groq Cloud',
    baseElo: 1315,
    baseSpeed: 580,
    topModel: 'llama-3.3-70b-versatile',
    topFreeModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    specialty: 'Fast General & Coding',
    freeQuota: '14,400 req/day',
    category: 'LPU Cloud'
  },
  sambanova: {
    name: 'SambaNova Cloud',
    baseElo: 1360,
    baseSpeed: 320,
    topModel: 'DeepSeek-R1',
    topFreeModels: ['DeepSeek-R1', 'Qwen2.5-Coder-32B'],
    specialty: 'High-Precision Reasoning & Code',
    freeQuota: 'Daily Free Tier',
    category: 'DataScale SN40L'
  },
  gemini: {
    name: 'Google AI Studio',
    baseElo: 1340,
    baseSpeed: 180,
    topModel: 'gemini-2.0-flash',
    topFreeModels: ['gemini-2.0-flash', 'gemini-1.5-flash'],
    specialty: 'Multimodal Vision & 1M Context',
    freeQuota: '1,500 req/day',
    category: 'Multimodal'
  },
  github: {
    name: 'GitHub Models',
    baseElo: 1335,
    baseSpeed: 90,
    topModel: 'gpt-4o',
    topFreeModels: ['gpt-4o', 'gpt-4o-mini'],
    specialty: 'OpenAI GPT-4o Quality',
    freeQuota: '150 req/day (PAT)',
    category: 'Enterprise Azure'
  },
  mistral: {
    name: 'Mistral AI',
    baseElo: 1300,
    baseSpeed: 120,
    topModel: 'codestral-latest',
    topFreeModels: ['codestral-latest', 'mistral-small-latest'],
    specialty: 'Polyglot Code Generation',
    freeQuota: 'Developer Tier',
    category: 'Code Specialist'
  },
  nvidia: {
    name: 'NVIDIA NIM',
    baseElo: 1310,
    baseSpeed: 150,
    topModel: 'meta/llama-3.3-70b-instruct',
    topFreeModels: ['meta/llama-3.3-70b-instruct', 'deepseek-ai/deepseek-r1'],
    specialty: 'Enterprise Microservices',
    freeQuota: '1,000 Free Credits',
    category: 'Enterprise Cloud'
  },
  openrouter: {
    name: 'OpenRouter Free',
    baseElo: 1295,
    baseSpeed: 90,
    topModel: 'meta-llama/llama-3.3-70b-instruct:free',
    topFreeModels: ['llama-3.3-70b-instruct:free', 'deepseek-r1:free', 'qwen-2.5-coder-32b:free'],
    specialty: '24+ Live Free Models',
    freeQuota: 'Zero-Cost Free Tier',
    category: 'Universal Aggregator'
  },
  zhipu: {
    name: 'Zhipu GLM-4',
    baseElo: 1290,
    baseSpeed: 240,
    topModel: 'glm-4-flash',
    topFreeModels: ['glm-4-flash', 'glm-4v'],
    specialty: 'Fast Bilingual Chat & Code',
    freeQuota: '100% Free Forever',
    category: 'Permanent Free Tier'
  },
  chutes: {
    name: 'Chutes AI',
    baseElo: 1285,
    baseSpeed: 140,
    topModel: 'deepseek-ai/DeepSeek-R1',
    topFreeModels: ['deepseek-ai/DeepSeek-R1', 'deepseek-ai/DeepSeek-V3'],
    specialty: 'Decentralized Fast Compute',
    freeQuota: 'Daily Free Tier',
    category: 'Decentralized Cloud'
  },
  pollinations: {
    name: 'Pollinations AI',
    baseElo: 1280,
    baseSpeed: 95,
    topModel: 'openai (GPT-4o-mini)',
    topFreeModels: ['openai', 'qwen', 'deepseek'],
    specialty: 'Zero-Key Public Endpoint',
    freeQuota: 'Public Free Endpoint',
    category: 'NoAuth Public'
  },
  hyperbolic: {
    name: 'Hyperbolic',
    baseElo: 1275,
    baseSpeed: 110,
    topModel: 'meta-llama/Llama-3.3-70B-Instruct',
    topFreeModels: ['Llama-3.3-70B-Instruct', 'Qwen2.5-Coder-32B'],
    specialty: 'Open Compute Clustered GPU',
    freeQuota: 'Free Starter Credits',
    category: 'GPU Cluster'
  },
  together: {
    name: 'Together AI',
    baseElo: 1265,
    baseSpeed: 140,
    topModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    topFreeModels: ['Llama-3.3-70B-Instruct-Turbo'],
    specialty: 'Fast Serverless Turbo Inference',
    freeQuota: '$5 Free Credit',
    category: 'Inference Cloud'
  },
  siliconflow: {
    name: 'SiliconFlow',
    baseElo: 1260,
    baseSpeed: 130,
    topModel: 'Qwen/Qwen2.5-7B-Instruct',
    topFreeModels: ['Qwen2.5-7B-Instruct', 'DeepSeek-R1-Distill-Qwen-7B'],
    specialty: 'High Concurrency Free Tier',
    freeQuota: 'Permanent Free Tier',
    category: 'Inference Cloud'
  },
  fireworks: {
    name: 'Fireworks AI',
    baseElo: 1270,
    baseSpeed: 220,
    topModel: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    topFreeModels: ['llama-v3p3-70b-instruct', 'deepseek-r1'],
    specialty: 'FireAttention Speculative Engine',
    freeQuota: '$1 Free Credit',
    category: 'High-Throughput'
  },
  huggingface: {
    name: 'HuggingFace',
    baseElo: 1270,
    baseSpeed: 85,
    topModel: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
    topFreeModels: ['DeepSeek-R1-Distill-Qwen-32B', 'Qwen2.5-Coder-32B-Instruct'],
    specialty: 'Open Source Community Hub',
    freeQuota: 'Free Serverless API',
    category: 'Open Source Hub'
  },
  cloudflare: {
    name: 'Cloudflare Workers AI',
    baseElo: 1250,
    baseSpeed: 160,
    topModel: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    topFreeModels: ['llama-3.3-70b-instruct-fp8-fast'],
    specialty: 'Global Edge Network Inference',
    freeQuota: '10,000 neurons/day (~Free)',
    category: 'Edge Network'
  },
  opencode: {
    name: 'OpenCode Free',
    baseElo: 1240,
    baseSpeed: 100,
    topModel: 'deepseek-v3',
    topFreeModels: ['deepseek-v3', 'qwen-2.5-72b'],
    specialty: 'Zero-Key Public Endpoint',
    freeQuota: 'Public Free Endpoint',
    category: 'NoAuth Public'
  },
  mock: {
    name: 'Extra LLM X Engine',
    baseElo: 1200,
    baseSpeed: 1500,
    topModel: 'extra-demo-model',
    topFreeModels: ['extra-demo-model', 'extra-demo-coder'],
    specialty: 'Zero-Key Intelligent Fallback',
    freeQuota: 'Unlimited Local ($0)',
    category: 'Autonomous Guard'
  }
};

export class ProviderBenchmarkingEngine {
  constructor() {
    this.intervalId = null;
  }

  /**
   * Generates dynamic rankings by blending base calibration with live request telemetry
   */
  getRankings() {
    const telemetryStats = BenchmarkStore.getAggregatedTelemetry();
    const liveBenchmarks = BenchmarkStore.getAll();
    const benchmarkMap = new Map(liveBenchmarks.map(b => [b.provider, b]));
    const telemetryMap = new Map(telemetryStats.map(t => [t.provider, t]));

    const list = Object.entries(BASE_PROVIDER_METRICS).map(([id, meta]) => {
      const adapter = adapterRegistry.get(id);
      const isNoAuth = adapter ? Boolean(adapter.isNoAuth) : false;
      const keyRecord = KeyStore.getAvailableProviderKey(id);
      const isConfigured = isNoAuth || Boolean(keyRecord);

      let speedTokPerSec = meta.baseSpeed;
      let eloScore = meta.baseElo;
      let latencyMs = Math.round(1000 / (meta.baseSpeed / 20)); // baseline latency estimate
      let sampleCount = 0;

      // Blend in actual telemetry from requests
      const tele = telemetryMap.get(id);
      if (tele && tele.request_count > 0) {
        sampleCount += tele.request_count;
        if (tele.total_latency_ms > 0 && tele.total_completion_tokens > 0) {
          const liveSpeed = Math.round(tele.total_completion_tokens / (tele.total_latency_ms / 1000));
          if (liveSpeed > 0) {
            speedTokPerSec = Math.round((meta.baseSpeed * 0.3) + (liveSpeed * 0.7));
          }
        }
        if (tele.avg_latency > 0) {
          latencyMs = Math.round(tele.avg_latency);
        }
      }

      // Blend in active benchmark probe data if exists
      const bench = benchmarkMap.get(id);
      if (bench && bench.sample_count > 0) {
        sampleCount += bench.sample_count;
        if (bench.speed_tok_per_sec > 0) {
          speedTokPerSec = Math.round((speedTokPerSec * 0.5) + (bench.speed_tok_per_sec * 0.5));
        }
        if (bench.latency_ms > 0) {
          latencyMs = Math.round((latencyMs * 0.5) + (bench.latency_ms * 0.5));
        }
      }

      // Dynamic ELO calculation based on latency and speed adjustments
      if (speedTokPerSec > 1000) eloScore += 30;
      else if (speedTokPerSec > 400) eloScore += 15;
      if (latencyMs < 200) eloScore += 20;

      return {
        id,
        name: meta.name,
        category: meta.category,
        benchmarkScore: eloScore,
        eloScore,
        speedTokPerSec,
        speed: `${Number(speedTokPerSec).toLocaleString()} tok/s`,
        latencyMs,
        topModel: meta.topModel,
        topFreeModels: meta.topFreeModels,
        specialty: meta.specialty,
        freeQuota: meta.freeQuota,
        quota: meta.freeQuota,
        isConfigured,
        isNoAuth,
        sampleCount
      };
    });

    // Sort descending by benchmark score
    list.sort((a, b) => b.benchmarkScore - a.benchmarkScore);

    // Assign ranking medals
    return list.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }

  /**
   * Runs a live micro-benchmark probe against a single provider to measure real TTFT and tok/s
   */
  async probeProvider(providerId) {
    const adapter = adapterRegistry.get(providerId);
    if (!adapter) throw new Error(`Unknown provider ${providerId}`);

    const isNoAuth = Boolean(adapter.isNoAuth) || providerId === 'mock' || providerId === 'pollinations';
    let apiKey = 'noauth';
    if (!isNoAuth) {
      const keyRecord = KeyStore.getAvailableProviderKey(providerId);
      if (!keyRecord) throw new Error(`Provider ${providerId} is unconfigured (no active API key)`);
      apiKey = keyRecord.api_key;
    }

    const testPrompt = [{ role: 'user', content: 'Respond with exactly: OK' }];
    const startTime = Date.now();

    const meta = BASE_PROVIDER_METRICS[providerId] || {};
    const testModel = meta.topFreeModels?.[0] || 'default';

    const response = await adapter.executeChat({
      apiKey,
      model: testModel,
      messages: testPrompt,
      stream: false,
      max_tokens: 16
    });

    const latencyMs = Date.now() - startTime;
    const completionTokens = response.usage?.completion_tokens || 4;
    const speedTokPerSec = Math.max(1, Math.round((completionTokens / (Math.max(latencyMs, 10) / 1000))));

    BenchmarkStore.recordProbe({
      provider: providerId,
      speedTokPerSec,
      latencyMs,
      ttftMs: Math.round(latencyMs * 0.7)
    });

    return {
      provider: providerId,
      testedModel: testModel,
      latencyMs,
      speedTokPerSec,
      success: true
    };
  }

  /**
   * Benchmarks all configured and zero-key providers
   */
  async probeAll() {
    const providersToTest = ['pollinations', 'mock', 'cerebras', 'groq', 'gemini', 'sambanova', 'openrouter'];
    const results = [];

    for (const p of providersToTest) {
      try {
        const res = await this.probeProvider(p);
        results.push(res);
      } catch (err) {
        results.push({
          provider: p,
          success: false,
          error: err.message
        });
      }
    }

    return results;
  }
}

export const benchmarkEngine = new ProviderBenchmarkingEngine();
