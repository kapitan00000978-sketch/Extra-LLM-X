import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const adaptersDir = path.join(rootDir, 'src', 'adapters');

const adapters = [
  {
    file: 'xai.js',
    className: 'XaiAdapter',
    id: 'xai',
    name: 'xAI (Grok)',
    badge: 'Frontier AI',
    getKeyUrl: 'https://console.x.ai/',
    guide: 'Sign up on xAI Cloud Console, create an API key with free starter credits.',
    freeTierInfo: '$25 free starter credit for new developers',
    popularModels: 'grok-2-1212, grok-2-vision-1212, grok-beta',
    keyPrefix: 'xai-',
    keyPlaceholder: 'xai-xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.x.ai/v1',
    models: [
      { id: 'grok-2-1212', name: 'Grok 2 (1212)', context: 131072, caps: 'chat,code,reasoning' },
      { id: 'grok-2-vision-1212', name: 'Grok 2 Vision (1212)', context: 32768, caps: 'chat,vision,multimodal' },
      { id: 'grok-beta', name: 'Grok Beta', context: 131072, caps: 'chat,code' }
    ]
  },
  {
    file: 'perplexity.js',
    className: 'PerplexityAdapter',
    id: 'perplexity',
    name: 'Perplexity AI',
    badge: 'Web-Grounded',
    getKeyUrl: 'https://www.perplexity.ai/settings/api',
    guide: 'Generate an API key in Perplexity settings for online grounded reasoning.',
    freeTierInfo: '$5 free trial credit on developer signup',
    popularModels: 'sonar-pro, sonar, sonar-reasoning',
    keyPrefix: 'pplx-',
    keyPlaceholder: 'pplx-xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.perplexity.ai',
    models: [
      { id: 'sonar', name: 'Sonar Search (Online)', context: 128000, caps: 'chat,search,web' },
      { id: 'sonar-pro', name: 'Sonar Pro Deep Search', context: 200000, caps: 'chat,search,reasoning' },
      { id: 'sonar-reasoning', name: 'Sonar Reasoning', context: 128000, caps: 'chat,reasoning,search' }
    ]
  },
  {
    file: 'moonshot.js',
    className: 'MoonshotAdapter',
    id: 'moonshot',
    name: 'Moonshot AI (Kimi)',
    badge: 'Long-Context',
    getKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
    guide: 'Obtain API key on Moonshot Developer Platform for 128k/200k context Kimi models.',
    freeTierInfo: '15 RMB (~$2) free credit on account verification',
    popularModels: 'moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot Kimi 8K', context: 8192, caps: 'chat,code' },
      { id: 'moonshot-v1-32k', name: 'Moonshot Kimi 32K', context: 32768, caps: 'chat,code,long-context' },
      { id: 'moonshot-v1-128k', name: 'Moonshot Kimi 128K', context: 131072, caps: 'chat,long-context,reasoning' }
    ]
  },
  {
    file: 'dashscope.js',
    className: 'DashScopeAdapter',
    id: 'dashscope',
    name: 'Alibaba Cloud (Qwen / DashScope)',
    badge: 'International Tier',
    getKeyUrl: 'https://dashscope.console.aliyun.com/',
    guide: 'Create API key on Alibaba Cloud Model Studio / DashScope console.',
    freeTierInfo: '1,000,000 free tokens quota per model family',
    popularModels: 'qwen-max, qwen-plus, qwen-turbo, qwen2.5-coder-32b-instruct',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-turbo', name: 'Qwen 2.5 Turbo', context: 131072, caps: 'chat,fast' },
      { id: 'qwen-plus', name: 'Qwen 2.5 Plus', context: 131072, caps: 'chat,code,reasoning' },
      { id: 'qwen2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B', context: 131072, caps: 'chat,code' },
      { id: 'qwen-max', name: 'Qwen 2.5 Max', context: 32768, caps: 'chat,reasoning' }
    ]
  },
  {
    file: 'minimax.js',
    className: 'MiniMaxAdapter',
    id: 'minimax',
    name: 'MiniMax',
    badge: 'MoE Architecture',
    getKeyUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
    guide: 'Register on MiniMax platform and generate standard Bearer API key.',
    freeTierInfo: 'Free trial starter credits on registration',
    popularModels: 'abab6.5s-chat, abab6.5t-chat, MiniMax-Text-01',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.minimax.chat/v1',
    models: [
      { id: 'abab6.5s-chat', name: 'MiniMax abab 6.5s', context: 245760, caps: 'chat,fast' },
      { id: 'MiniMax-Text-01', name: 'MiniMax-Text-01 MoE', context: 1000000, caps: 'chat,long-context,reasoning' },
      { id: 'abab6.5t-chat', name: 'MiniMax abab 6.5t', context: 245760, caps: 'chat,code' }
    ]
  },
  {
    file: 'lingyiwanwu.js',
    className: 'LingyiwanwuAdapter',
    id: 'lingyiwanwu',
    name: '01.AI (Yi)',
    badge: 'Open-Weights Lead',
    getKeyUrl: 'https://platform.lingyiwanwu.com/apikeys',
    guide: 'Generate API key on 01.AI platform for Yi Large and Yi Coder models.',
    freeTierInfo: 'Free trial compute quota on phone verification',
    popularModels: 'yi-large, yi-medium, yi-spark, yi-coder',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.lingyiwanwu.com/v1',
    models: [
      { id: 'yi-large', name: 'Yi Large', context: 32768, caps: 'chat,reasoning' },
      { id: 'yi-medium', name: 'Yi Medium', context: 16384, caps: 'chat,fast' },
      { id: 'yi-spark', name: 'Yi Spark Lite', context: 16384, caps: 'chat,fast' }
    ]
  },
  {
    file: 'stepfun.js',
    className: 'StepFunAdapter',
    id: 'stepfun',
    name: 'StepFun (Jieyue)',
    badge: 'Multimodal CoT',
    getKeyUrl: 'https://platform.stepfun.com/interface-key',
    guide: 'Create StepFun API token on the developer portal for Step-1 and Step-2 models.',
    freeTierInfo: 'Free trial tokens upon registration',
    popularModels: 'step-1-8k, step-1-32k, step-2-16k',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.stepfun.com/v1',
    models: [
      { id: 'step-1-8k', name: 'Step-1 8K', context: 8192, caps: 'chat,fast' },
      { id: 'step-1-32k', name: 'Step-1 32K', context: 32768, caps: 'chat,long-context' },
      { id: 'step-2-16k', name: 'Step-2 16K Reasoning', context: 16384, caps: 'chat,reasoning' }
    ]
  },
  {
    file: 'iflytek.js',
    className: 'IflytekAdapter',
    id: 'iflytek',
    name: 'iFlytek Spark',
    badge: 'Cognitive Engine',
    getKeyUrl: 'https://xinghuo.xfyun.cn/sparkapi',
    guide: 'Register on iFlytek Spark Open Platform and obtain API key credentials.',
    freeTierInfo: 'Spark Lite is permanently free with unlimited queries',
    popularModels: 'general, generalv3, lite',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://spark-api-open.xf-yun.com/v1',
    models: [
      { id: 'lite', name: 'Spark Lite (Free Forever)', context: 8192, caps: 'chat,fast' },
      { id: 'general', name: 'Spark V3.5 Pro', context: 8192, caps: 'chat,code' },
      { id: 'generalv3', name: 'Spark Ultra', context: 32768, caps: 'chat,reasoning' }
    ]
  },
  {
    file: 'volcengine.js',
    className: 'VolcengineAdapter',
    id: 'volcengine',
    name: 'ByteDance Volcengine (Doubao)',
    badge: 'Doubao LLM',
    getKeyUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
    guide: 'Generate API key in ByteDance Volcano Engine Ark console.',
    freeTierInfo: '500,000 free tokens on Doubao model endpoints',
    popularModels: 'doubao-pro-4k, doubao-lite-4k, doubao-pro-32k',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      { id: 'doubao-lite-4k', name: 'Doubao Lite 4K', context: 4096, caps: 'chat,fast' },
      { id: 'doubao-pro-4k', name: 'Doubao Pro 4K', context: 4096, caps: 'chat,code' },
      { id: 'doubao-pro-32k', name: 'Doubao Pro 32K', context: 32768, caps: 'chat,long-context' }
    ]
  },
  {
    file: 'qianfan.js',
    className: 'QianfanAdapter',
    id: 'qianfan',
    name: 'Baidu Qianfan (ERNIE)',
    badge: 'ERNIE Speed Free',
    getKeyUrl: 'https://console.bce.baidu.com/qianfan/ais/console/onlineService',
    guide: 'Obtain Qianfan API Key on Baidu AI Cloud Console.',
    freeTierInfo: 'ERNIE-Speed-8K and ERNIE-Lite are permanently free',
    popularModels: 'ernie-speed-8k, ernie-lite-8k, ernie-4.0-turbo-8k',
    keyPrefix: 'bce-v3/',
    keyPlaceholder: 'bce-v3/ALTAK-xxxxxxxxxxxxxxxx',
    baseUrl: 'https://qianfan.baidubce.com/v2',
    models: [
      { id: 'ernie-speed-8k', name: 'ERNIE Speed 8K (Free)', context: 8192, caps: 'chat,fast' },
      { id: 'ernie-lite-8k', name: 'ERNIE Lite 8K (Free)', context: 8192, caps: 'chat,fast' },
      { id: 'ernie-4.0-turbo-8k', name: 'ERNIE 4.0 Turbo', context: 8192, caps: 'chat,reasoning' }
    ]
  },
  {
    file: 'reka.js',
    className: 'RekaAdapter',
    id: 'reka',
    name: 'Reka AI',
    badge: 'Multimodal Research',
    getKeyUrl: 'https://platform.reka.ai/',
    guide: 'Sign up on Reka Platform and create API Key for Flash and Core multimodal models.',
    freeTierInfo: 'Free developer starter credits upon account creation',
    popularModels: 'reka-flash, reka-core, reka-edge',
    keyPrefix: '',
    keyPlaceholder: 'rek_xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.reka.ai/v1',
    customHeaders: (apiKey) => ({ 'X-Api-Key': apiKey, 'Content-Type': 'application/json' }),
    models: [
      { id: 'reka-flash', name: 'Reka Flash', context: 128000, caps: 'chat,vision,code' },
      { id: 'reka-core', name: 'Reka Core', context: 128000, caps: 'chat,reasoning,multimodal' },
      { id: 'reka-edge', name: 'Reka Edge', context: 32768, caps: 'chat,fast' }
    ]
  },
  {
    file: 'ai21.js',
    className: 'Ai21Adapter',
    id: 'ai21',
    name: 'AI21 Labs',
    badge: 'Jamba Mamba+Transformer',
    getKeyUrl: 'https://studio.ai21.com/account/api-key',
    guide: 'Generate an API key on AI21 Studio for Jamba hybrid SSM-Transformer inference.',
    freeTierInfo: '$10.00 free credit on signup valid for 3 months',
    popularModels: 'jamba-1.5-mini, jamba-1.5-large, jamba-instruct',
    keyPrefix: '',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.ai21.com/studio/v1',
    models: [
      { id: 'jamba-1.5-mini', name: 'Jamba 1.5 Mini (SSM-Transformer)', context: 256000, caps: 'chat,fast,long-context' },
      { id: 'jamba-1.5-large', name: 'Jamba 1.5 Large', context: 256000, caps: 'chat,code,reasoning' }
    ]
  },
  {
    file: 'writer.js',
    className: 'WriterAdapter',
    id: 'writer',
    name: 'Writer (Palmyra)',
    badge: 'Enterprise Palmyra',
    getKeyUrl: 'https://dev.writer.com/',
    guide: 'Obtain API key on Writer Developer Portal for enterprise Palmyra LLMs.',
    freeTierInfo: 'Free trial developer credits on sign up',
    popularModels: 'palmyra-x-004, palmyra-med-70b, palmyra-fin-70b',
    keyPrefix: '',
    keyPlaceholder: 'wrt_xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.writer.com/v1',
    models: [
      { id: 'palmyra-x-004', name: 'Palmyra X 004', context: 128000, caps: 'chat,code,reasoning' },
      { id: 'palmyra-med-70b', name: 'Palmyra Medical 70B', context: 32768, caps: 'chat,reasoning' }
    ]
  },
  {
    file: 'voyage.js',
    className: 'VoyageAdapter',
    id: 'voyage',
    name: 'Voyage AI',
    badge: 'SOTA Embeddings',
    getKeyUrl: 'https://dash.voyageai.com/api-keys',
    guide: 'Sign up on Voyage AI dashboard for top-ranked text and code embeddings.',
    freeTierInfo: '50 Million Free Tokens on registration',
    popularModels: 'voyage-3, voyage-3-lite, voyage-code-3',
    keyPrefix: 'pa-',
    keyPlaceholder: 'pa-xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.voyageai.com/v1',
    isEmbeddingOnly: true,
    models: [
      { id: 'voyage-3', name: 'Voyage 3 Embedding (1024d)', context: 32000, caps: 'embedding' },
      { id: 'voyage-3-lite', name: 'Voyage 3 Lite Embedding (512d)', context: 32000, caps: 'embedding' },
      { id: 'voyage-code-3', name: 'Voyage Code 3 Embedding (1024d)', context: 32000, caps: 'embedding,code' }
    ]
  },
  {
    file: 'jina.js',
    className: 'JinaAdapter',
    id: 'jina',
    name: 'Jina AI',
    badge: 'Search & Embeddings',
    getKeyUrl: 'https://jina.ai/embeddings/',
    guide: 'Obtain Jina AI Bearer token for multilingual embeddings and rerankers.',
    freeTierInfo: '10 Million Free Tokens permanent allowance',
    popularModels: 'jina-embeddings-v3, jina-reranker-v2-base-multilingual, jina-deepsearch-v1',
    keyPrefix: 'jina_',
    keyPlaceholder: 'jina_xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.jina.ai/v1',
    models: [
      { id: 'jina-embeddings-v3', name: 'Jina Embeddings v3 (1024d)', context: 8192, caps: 'embedding' },
      { id: 'jina-deepsearch-v1', name: 'Jina DeepSearch Reader', context: 64000, caps: 'chat,search' }
    ]
  },
  {
    file: 'watsonx.js',
    className: 'WatsonxAdapter',
    id: 'watsonx',
    name: 'IBM watsonx.ai',
    badge: 'Granite & Llama',
    getKeyUrl: 'https://cloud.ibm.com/iam/apikeys',
    guide: 'Create an IBM Cloud IAM API Key for watsonx enterprise granite foundation models.',
    freeTierInfo: '$200 IBM Cloud trial credit on new account signup',
    popularModels: 'ibm/granite-3-8b-instruct, ibm/granite-3-2b-instruct, meta-llama/llama-3-3-70b-instruct',
    keyPrefix: '',
    keyPlaceholder: 'ibm_cloud_iam_apikey_xxxxxxxx',
    baseUrl: 'https://us-south.ml.cloud.ibm.com/ml/v1',
    models: [
      { id: 'ibm/granite-3-8b-instruct', name: 'IBM Granite 3.0 8B', context: 128000, caps: 'chat,code' },
      { id: 'ibm/granite-3-2b-instruct', name: 'IBM Granite 3.0 2B', context: 128000, caps: 'chat,fast' }
    ]
  },
  {
    file: 'vertex.js',
    className: 'VertexAdapter',
    id: 'vertex',
    name: 'Google Cloud Vertex AI',
    badge: 'Enterprise Vertex',
    getKeyUrl: 'https://console.cloud.google.com/vertex-ai',
    guide: 'Generate Google Cloud OAuth2 token or service account for enterprise Vertex AI.',
    freeTierInfo: '$300 Google Cloud free trial credit',
    popularModels: 'gemini-1.5-pro, gemini-1.5-flash, claude-3-5-sonnet-v2',
    keyPrefix: '',
    keyPlaceholder: 'ya29.xxxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: [
      { id: 'gemini-1.5-flash', name: 'Vertex Gemini 1.5 Flash', context: 1000000, caps: 'chat,fast,vision' },
      { id: 'gemini-1.5-pro', name: 'Vertex Gemini 1.5 Pro', context: 2000000, caps: 'chat,reasoning,code' }
    ]
  },
  {
    file: 'nebius.js',
    className: 'NebiusAdapter',
    id: 'nebius',
    name: 'Nebius AI Studio',
    badge: 'H100 NVLink Cluster',
    getKeyUrl: 'https://studio.nebius.ai/settings/api-keys',
    guide: 'Generate API key in Nebius AI Studio for low-latency H100 inference.',
    freeTierInfo: '$10.00 free credit on registration',
    popularModels: 'meta-llama/Llama-3.3-70B-Instruct, deepseek-ai/DeepSeek-V3, Qwen/Qwen2.5-Coder-32B-Instruct',
    keyPrefix: '',
    keyPlaceholder: 'neb_xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.studio.nebius.ai/v1',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B (Nebius H100)', context: 131072, caps: 'chat,code' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3 (Nebius)', context: 64000, caps: 'chat,code,reasoning' },
      { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B (Nebius)', context: 32768, caps: 'chat,code' }
    ]
  },
  {
    file: 'scaleway.js',
    className: 'ScalewayAdapter',
    id: 'scaleway',
    name: 'Scaleway Generative APIs',
    badge: 'European Sovereign',
    getKeyUrl: 'https://console.scaleway.com/iam/api-keys',
    guide: 'Generate API key in Scaleway European cloud console for Generative AI endpoints.',
    freeTierInfo: 'Free starter tier with generous monthly requests',
    popularModels: 'llama-3.3-70b-instruct, deepseek-r1-distill-llama-70b, bge-multilingual-gemma2',
    keyPrefix: '',
    keyPlaceholder: 'scw_xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.scaleway.ai/v1',
    models: [
      { id: 'llama-3.3-70b-instruct', name: 'Scaleway Llama 3.3 70B', context: 131072, caps: 'chat,code' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'Scaleway DeepSeek-R1 Distill 70B', context: 131072, caps: 'chat,reasoning' }
    ]
  },
  {
    file: 'ovhcloud.js',
    className: 'OvhCloudAdapter',
    id: 'ovhcloud',
    name: 'OVHcloud AI Endpoints',
    badge: 'Sovereign Kepler',
    getKeyUrl: 'https://endpoints.kepler.ai.cloud.ovh.net/',
    guide: 'Generate Bearer token on OVHcloud AI Endpoints portal for open-source model inference.',
    freeTierInfo: 'Free test access tier available for developers',
    popularModels: 'Meta-Llama-3-1-70B-Instruct, Mistral-7B-Instruct-v0.3, DeepSeek-R1-Distill-Qwen-32B',
    keyPrefix: '',
    keyPlaceholder: 'ovh_xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1',
    models: [
      { id: 'Meta-Llama-3-1-70B-Instruct', name: 'OVH Llama 3.1 70B', context: 128000, caps: 'chat,code' },
      { id: 'Mistral-7B-Instruct-v0.3', name: 'OVH Mistral 7B v0.3', context: 32768, caps: 'chat,fast' }
    ]
  },
  {
    file: 'friendli.js',
    className: 'FriendliAdapter',
    id: 'friendli',
    name: 'Friendli AI Serverless',
    badge: 'Ultra Low TTFT',
    getKeyUrl: 'https://suite.friendli.ai/settings/tokens',
    guide: 'Generate personal access token on Friendli Suite dashboard for serverless inference.',
    freeTierInfo: '$5.00 free compute credits for new developers',
    popularModels: 'meta-llama-3.1-70b-instruct, deepseek-v3, mistral-7b-instruct-v0.3',
    keyPrefix: 'flp_',
    keyPlaceholder: 'flp_xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.friendli.ai/serverless/v1',
    models: [
      { id: 'meta-llama-3.1-70b-instruct', name: 'Friendli Llama 3.1 70B', context: 128000, caps: 'chat,code' },
      { id: 'deepseek-v3', name: 'Friendli DeepSeek V3', context: 64000, caps: 'chat,reasoning' }
    ]
  },
  {
    file: 'featherless.js',
    className: 'FeatherlessAdapter',
    id: 'featherless',
    name: 'Featherless AI',
    badge: '1000+ Models',
    getKeyUrl: 'https://featherless.ai/account/api-keys',
    guide: 'Obtain API key on Featherless AI to access over 1,000 open-source fine-tunes.',
    freeTierInfo: 'Free trial access to open model catalog',
    popularModels: 'meta-llama/Meta-Llama-3.1-70B-Instruct, mistralai/Mistral-7B-Instruct-v0.3',
    keyPrefix: '',
    keyPlaceholder: 'feather_xxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.featherless.ai/v1',
    models: [
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'Featherless Llama 3.1 70B', context: 128000, caps: 'chat,code' },
      { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Featherless Mistral 7B', context: 32768, caps: 'chat,fast' }
    ]
  },
  {
    file: 'replicate.js',
    className: 'ReplicateAdapter',
    id: 'replicate',
    name: 'Replicate',
    badge: 'Cloud Predictions',
    getKeyUrl: 'https://replicate.com/account/api-tokens',
    guide: 'Create an API token on Replicate dashboard for running open-source models in the cloud.',
    freeTierInfo: 'Free trial compute upon account setup',
    popularModels: 'meta/meta-llama-3.70b-instruct, deepseek-ai/deepseek-r1',
    keyPrefix: 'r8_',
    keyPlaceholder: 'r8_xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.replicate.com/v1',
    isReplicateStyle: true,
    models: [
      { id: 'meta/meta-llama-3-70b-instruct', name: 'Replicate Llama 3 70B', context: 8192, caps: 'chat,code' },
      { id: 'deepseek-ai/deepseek-r1', name: 'Replicate DeepSeek R1', context: 32768, caps: 'chat,reasoning' }
    ]
  },
  {
    file: 'baseten.js',
    className: 'BasetenAdapter',
    id: 'baseten',
    name: 'Baseten',
    badge: 'Truss Serverless',
    getKeyUrl: 'https://app.baseten.co/settings/api_keys',
    guide: 'Create an API Key on Baseten to access high-throughput model deployments.',
    freeTierInfo: '$30 free starter trial credits',
    popularModels: 'llama-3.3-70b-instruct, mistral-nemo-12b',
    keyPrefix: '',
    keyPlaceholder: 'baseten_key_xxxxxxxxxxxxxxxx',
    baseUrl: 'https://bridge.baseten.co/v1',
    customHeaders: (apiKey) => ({ 'Authorization': `Api-Key ${apiKey}`, 'Content-Type': 'application/json' }),
    models: [
      { id: 'llama-3.3-70b-instruct', name: 'Baseten Llama 3.3 70B', context: 128000, caps: 'chat,code' },
      { id: 'mistral-nemo-12b', name: 'Baseten Mistral Nemo 12B', context: 128000, caps: 'chat,fast' }
    ]
  },
  {
    file: 'segmind.js',
    className: 'SegmindAdapter',
    id: 'segmind',
    name: 'Segmind',
    badge: 'Fast Generative AI',
    getKeyUrl: 'https://www.segmind.com/api-keys',
    guide: 'Generate API key on Segmind dashboard for fast text and image generation models.',
    freeTierInfo: '100 free requests per day permanent quota',
    popularModels: 'llama-3-8b-instruct, qwen-2.5-7b-instruct',
    keyPrefix: 'SG_',
    keyPlaceholder: 'SG_xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.segmind.com/v1',
    customHeaders: (apiKey) => ({ 'x-api-key': apiKey, 'Content-Type': 'application/json' }),
    models: [
      { id: 'llama-3-8b-instruct', name: 'Segmind Llama 3 8B', context: 8192, caps: 'chat,fast' },
      { id: 'qwen-2.5-7b-instruct', name: 'Segmind Qwen 2.5 7B', context: 32768, caps: 'chat,code' }
    ]
  },
  {
    file: 'nlpcloud.js',
    className: 'NlpCloudAdapter',
    id: 'nlpcloud',
    name: 'NLP Cloud',
    badge: 'NLP Microservices',
    getKeyUrl: 'https://nlpcloud.com/home/token',
    guide: 'Obtain API token on NLP Cloud console for production-ready open models.',
    freeTierInfo: '1 free request per minute free forever plan',
    popularModels: 'finetuned-llama-3-70b, dolphin',
    keyPrefix: '',
    keyPlaceholder: 'nlpcloud_token_xxxxxxxx',
    baseUrl: 'https://api.nlpcloud.io/v1',
    customHeaders: (apiKey) => ({ 'Authorization': `Token ${apiKey}`, 'Content-Type': 'application/json' }),
    models: [
      { id: 'finetuned-llama-3-70b', name: 'NLP Cloud Llama 3 70B', context: 8192, caps: 'chat,code' },
      { id: 'dolphin', name: 'NLP Cloud Dolphin', context: 8192, caps: 'chat,fast' }
    ]
  },
  {
    file: 'poe.js',
    className: 'PoeAdapter',
    id: 'poe',
    name: 'Poe API (Quora)',
    badge: 'Multi-Bot Hub',
    getKeyUrl: 'https://poe.com/api_key',
    guide: 'Generate an API key on Poe.com settings to interact with standard Poe bots.',
    freeTierInfo: 'Free daily compute points for registered Poe users',
    popularModels: 'Claude-3.5-Sonnet, GPT-4o-Mini, Llama-3.3-70B-T',
    keyPrefix: 'p-',
    keyPlaceholder: 'p-xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.poe.com/v1',
    models: [
      { id: 'Llama-3.3-70B-T', name: 'Poe Llama 3.3 70B', context: 128000, caps: 'chat,code' },
      { id: 'GPT-4o-Mini', name: 'Poe GPT-4o Mini', context: 128000, caps: 'chat,fast' }
    ]
  },
  {
    file: 'inference_net.js',
    className: 'InferenceNetAdapter',
    id: 'inference_net',
    name: 'Inference.net',
    badge: 'Open Compute',
    getKeyUrl: 'https://inference.net/dashboard',
    guide: 'Obtain API key on Inference.net for serverless open-source model execution.',
    freeTierInfo: 'Free developer tier for community models',
    popularModels: 'meta-llama/llama-3.3-70b-instruct, deepseek-ai/deepseek-r1',
    keyPrefix: 'inf_',
    keyPlaceholder: 'inf_xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.inference.net/v1',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Inference.net Llama 3.3 70B', context: 131072, caps: 'chat,code' },
      { id: 'deepseek-ai/deepseek-r1', name: 'Inference.net DeepSeek R1', context: 64000, caps: 'chat,reasoning' }
    ]
  },
  {
    file: 'gmicloud.js',
    className: 'GmiCloudAdapter',
    id: 'gmicloud',
    name: 'GMI Cloud Inference',
    badge: 'Enterprise GPUs',
    getKeyUrl: 'https://gmicloud.ai/dashboard/api-keys',
    guide: 'Create API token on GMI Cloud Console for dedicated GPU model inference.',
    freeTierInfo: 'Free trial starter credits on registration',
    popularModels: 'meta-llama/llama-3.3-70b-instruct, qwen/qwen-2.5-coder-32b',
    keyPrefix: 'gmi_',
    keyPlaceholder: 'gmi_xxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.gmicloud.ai/v1',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'GMI Cloud Llama 3.3 70B', context: 131072, caps: 'chat,code' },
      { id: 'qwen/qwen-2.5-coder-32b', name: 'GMI Qwen 2.5 Coder 32B', context: 32768, caps: 'chat,code' }
    ]
  },
  {
    file: 'lepton.js',
    className: 'LeptonAdapter',
    id: 'lepton',
    name: 'Lepton AI',
    badge: 'Fast Serverless',
    getKeyUrl: 'https://dashboard.lepton.ai/credentials',
    guide: 'Generate Workspace Token on Lepton AI dashboard for 500+ tok/s serverless models.',
    freeTierInfo: '$10.00 free credit on workspace creation',
    popularModels: 'llama3-3-70b, deepseek-r1, qwen2-5-coder-32b',
    keyPrefix: '',
    keyPlaceholder: 'lepton_token_xxxxxxxxxxxxxxx',
    baseUrl: 'https://api.lepton.ai/v1',
    models: [
      { id: 'llama3-3-70b', name: 'Lepton Llama 3.3 70B', context: 128000, caps: 'chat,code' },
      { id: 'deepseek-r1', name: 'Lepton DeepSeek R1', context: 64000, caps: 'chat,reasoning' }
    ]
  }
];

for (const a of adapters) {
  const filePath = path.join(adaptersDir, a.file);
  
  let headerCode = `headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${apiKey}\` },`;
  if (a.customHeaders) {
    if (a.id === 'reka') headerCode = `headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },`;
    if (a.id === 'baseten') headerCode = `headers: { 'Content-Type': 'application/json', 'Authorization': \`Api-Key \${apiKey}\` },`;
    if (a.id === 'segmind') headerCode = `headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },`;
    if (a.id === 'nlpcloud') headerCode = `headers: { 'Content-Type': 'application/json', 'Authorization': \`Token \${apiKey}\` },`;
  }

  const fileContent = `import { BaseAdapter } from './base.js';

export class ${a.className} extends BaseAdapter {
  constructor() {
    super({
      id: '${a.id}',
      name: '${a.name}',
      badge: '${a.badge}',
      getKeyUrl: '${a.getKeyUrl}',
      guide: '${a.guide.replace(/'/g, "\\'")}',
      freeTierInfo: '${a.freeTierInfo.replace(/'/g, "\\'")}',
      popularModels: '${a.popularModels}',
      keyPrefix: '${a.keyPrefix}',
      keyPlaceholder: '${a.keyPlaceholder}'
    });
    this.baseUrl = '${a.baseUrl}';
    this.freeModels = ${JSON.stringify(a.models, null, 6)};
  }

  async discoverModels(apiKey) {
    return this.freeModels.map(m => ({
      id: \`${a.id}/\${m.id}\`,
      provider: '${a.id}',
      model_id: m.id,
      display_name: \`\${m.name} [${a.name}]\`,
      description: '${a.name} Inference Tier',
      context_window: m.context,
      is_free: 1,
      capabilities: m.caps
    }));
  }

  async executeChat({ apiKey, model, messages, stream = false, temperature, max_tokens, tools, tool_choice }) {
    const rawModel = model.replace(/^${a.id}\\//, '');
    const body = { 
      model: rawModel, 
      messages, 
      stream, 
      ...(temperature !== undefined ? { temperature } : {}), 
      ...(max_tokens !== undefined ? { max_tokens } : {}),
      ...(tools?.length ? { tools, tool_choice } : {}) 
    };

    let targetUrl = \`\${this.baseUrl}/chat/completions\`;
    ${a.id === 'replicate' ? `
    // Replicate OpenAI compatibility proxy or native prediction translation
    targetUrl = \`\${this.baseUrl}/chat/completions\`;
    ` : ''}

    const res = await fetch(targetUrl, {
      method: 'POST',
      ${headerCode}
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      const err = new Error(\`${a.name} API error \${res.status}: \${errText}\`);
      err.status = res.status;
      throw err;
    }
    return res;
  }
}
`;

  fs.writeFileSync(filePath, fileContent, 'utf8');
  console.log(`Created adapter: ${a.file}`);
}

console.log(`Successfully created all ${adapters.length} adapters!`);
