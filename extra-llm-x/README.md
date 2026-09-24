# ⚡ EXTRA LLM X — 100% Free AI Model Gateway & API Key Provider

> **Next-Generation 100% Free LLM Aggregator, Dynamic Discovery Engine, and API Key Provider purpose-built for Universal Agent HP, Cursor, Cline, Claude Code, and Autonomous Agents.**

---

## 🌟 Nega Aynan Extra LLM X?

Oddiy AI gateway'lar (masalan, OmniRoute yoki LiteLLM) barcha modellarni aralashtirib yuboradi va foydalanuvchi bilmasdan pullik modellarga so'rov yuborib mablag' sarflab qo'yishi mumkin.

**Extra LLM X** esa **faqat va faqat 100% BEPUL modellar va bepul kvotalar (Free Tiers)** ustiga qurilgan:
1. **100% Kafolatlangan Bepul Modellar:** Barcha 26+ provayderlardagi (Groq, Google Gemini, OpenRouter, SambaNova, Cerebras, GitHub Models, Mistral, HuggingFace, Together, Cloudflare, Fireworks, DeepInfra, Novita, Cohere, Ollama, LM Studio) narxi $0 bo'lgan modellar avtomatik kashf etiladi va filtrlanadi.
2. **O'zining API Kalitlarini Yaratish:** Server o'zining `elx-live-...` formatidagi mijoz API kalitlarini yaratadi, tezlikni cheklaydi (rate limit) va foydalanish statistikasini yuritadi.
3. **Aqlli Avto-Fallback (Kutilmagan Limitlarni Yengish):** Agar biror bepul provayderda 429 Rate Limit uchrasa, tizim uzilishsiz boshqa zaxira kalitga yoki boshqa provayderdagi muqobil bepul modelga ulanadi.
4. **Universal Agent HP ga To'liq Moslashgan:** Universal Agent HP ning CEO, DAG to'lqinlari va 29 mutaxassis agentlari 24/7 uzluksiz, bir tiyin ham to'lamasdan ishlashi uchun barcha virtual kombolar (`extra/auto-free`, `extra/free-coding`, `extra/free-fast`, `extra/free-reasoning`) tayyorlangan.
5. **Futuristik Cyberpunk Web Boshqaruv Paneli:** Real-vaqtda tejangan mablag' hisoblagichi, jonli streaming Playground, provayderlarni bir klikda test qilish.
6. **Zero-Key Demo Rejim:** Agar sizda hali bitta ham API kalit bo'lmasa, server built-in simulyatsiya orqali to'liq ishlaydi, streaming uzatadi va barcha endpointlar 100% javob beradi.

---

## 🚀 1-Klikda Ishga Tushirish (Windows)

Faqatgina **`start.bat`** faylini ikki marta bosing!
U avtomatik ravishda:
1. Kerakli kutubxonalarni tekshiradi va o'rnatadi.
2. Extra LLM X serverini `http://localhost:3000` manzilida ko'taradi.
3. Brauzerda avtomatik ravishda boshqaruv panelini ochadi!

### Qo'lda ishga tushirish (Terminal orqali):
```bash
npm install
npm start
```

---

## 🤖 Universal Agent HP ga Ulash

Universal Agent HP papkasidagi `.env` fayliga quyidagi qatorlarni qo'shing (yoki `universal_agent_config.env` faylidan nusxa oling):

```env
# Primary Autonomous Provider
TITAN_PROVIDER=omni
TITAN_MODEL=extra/auto-free

# Extra LLM X Gateway Connection
OPENAI_API_BASE=http://localhost:3000/v1
OPENAI_API_KEY=elx-live-universal-agent-free-hub

# Model Tiers (All 100% Free)
FAST_MODEL=extra/free-fast
CODING_MODEL=extra/free-coding
REASONING_MODEL=extra/free-reasoning
VISION_MODEL=extra/free-vision
```

Endi terminalda:
```bash
universal --provider omni --model extra/auto-free
```
yoki DAG orqali:
```bash
universal --dag "Katta loyihani ishlab chiq va test qil"
```

---

## 🔌 Qo'llab-quvvatlanadigan 26+ Bepul Provayderlar

Boshqaruv panelida har bir provayder uchun bepul kalit olish havolasi va ko'rsatmalar mavjud:

| Provayder | Bepul Modellar | Bepul Kvota / Imkoniyat |
| :--- | :--- | :--- |
| **DeepSeek Official** | `deepseek-chat` (V3), `deepseek-reasoner` (R1) | 5M Free Tokens, Native Chain-of-Thought |
| **Google AI Studio** | `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-1.5-pro` | 15 req/min, 1,500 req/day (Doimiy Bepul) |
| **Groq Cloud** | `llama-3.3-70b-versatile`, `deepseek-r1-distill-llama-70b` | 30 req/min, 500+ tok/s (LPU Tezligi) |
| **OpenRouter** | 30+ bepul modellar (`:free` suffiksi bilan) | Barcha `:free` modellar $0 narxda |
| **SambaNova Cloud** | `Meta-Llama-3.3-70B-Instruct`, `DeepSeek-R1` | SN40L chipi, bepul developer tier |
| **Cerebras Cloud** | `llama-3.3-70b`, `llama3.1-8b` | 2,000+ tok/s dunyodagi eng tezkor wafer |
| **GitHub Models** | `gpt-4o`, `gpt-4o-mini`, `Phi-4`, `Llama-3.3-70B` | Bepul GitHub Personal Access Token orqali |
| **Mistral AI** | `codestral-latest`, `mistral-small-latest` | Bepul dasturlash uchun eksperimental kvota |
| **Hyperbolic** | `llama-3.3-70b`, `qwen-2.5-coder-32b` | Serverless bepul developer compute |
| **AIML API** | `deepseek-r1`, `llama-3.3-70b`, `gpt-4o-mini` | 100+ modellar bepul boshlang'ich tier |
| **Chutes AI** | `deepseek-v3`, `deepseek-r1` | Decentralized serverless inferens |
| **SiliconFlow** | `deepseek-ai/DeepSeek-V3`, `Qwen/Qwen2.5-7B` | 20M bepul tokenlar doimiy kvota |
| **Zhipu AI (GLM-4)** | `glm-4-flash` | Doimiy bepul 100% cheksiz tier |
| **OpenCode Free** | `deepseek-v3`, `glm-4`, `qwen-2.5-72b` | Kalitsiz (NoAuth) ochiq endpoint |
| **Pollinations AI** | `openai` (GPT-4o-mini), `qwen`, `mistral` | Kalitsiz (NoAuth) ochiq endpoint |
| **Hugging Face** | `Qwen2.5-Coder-32B`, `DeepSeek-R1-Qwen-32B` | Bepul User Token orqali serverless inferens |
| **Together AI** | `Llama-3.3-70B-Turbo` | Bepul kredit tieri |
| **Cloudflare AI** | `llama-3.3-70b-instruct`, `deepseek-r1-32b` | 10,000 kunlik bepul neyronlar |
| **Fireworks AI** | `llama-v3p3-70b`, `deepseek-r1` | Bepul developer trial kreditlari |
| **DeepInfra** | `Llama-3.3-70B`, `DeepSeek-R1` | Bepul trial starter krediti |
| **Novita AI** | `llama-3.3-70b`, `deepseek-r1` | Bepul trial tieri |
| **Cohere** | `command-r-plus`, `command-r` | Bepul oylik developer trial |
| **NVIDIA NIM** | `meta/llama-3.3-70b-instruct` | 1,000 bepul kredit starter |
| **Ollama** | Sizning kompyuteringizdagi barcha modellar | 100% Oflayn va Bepul (`localhost:11434`) |
| **LM Studio** | Mahalliy yuklangan modellar | 100% Oflayn va Bepul (`localhost:1234`) |
| **Built-in Demo** | `extra-demo-model`, `extra-demo-coder` | Kalitsiz darhol sinovdan o'tkazish |

---

## ⚡ Multimodal To'liq Paritet ($0 Xarajat bilan)

Extra LLM X faqatgina matn emas, balki OpenAI spetsifikatsiyasining barcha multimodal endpointlarini 100% bepul taqdim etadi:

1. **Matn & Kod Generatsiyasi:** `POST /v1/chat/completions` (Streaming SSE, JSON Mode, Tool/Function Calling).
2. **100% Bepul Vektor Embeddinglar:** `POST /v1/embeddings` (Universal Agent xotirasi va RAG uchun 1536 o'lchamli normalizatsiyalangan vektorlar).
3. **100% Bepul Rasm Generatsiyasi:** `POST /v1/images/generations` (Pollinations Flux va Turbo arxitekturasi orqali fotorealistik tasvirlar).
4. **Ovozli Transkripsiya (Whisper STT):** `POST /v1/audio/transcriptions` (Groq LPU orqali sub-soniyalik Whisper Large V3 nutqni matnga o'girish).
5. **Xavfsizlik & Moderatsiya:** `POST /v1/moderations` (Hate, violence, self-harm filtrlovchi kontent tekshiruvi).
6. **L1/L2 Semantik Kesh:** SHA-256 kanonik heshlash, L1 LRU xotira + L2 SQLite xotirasi. Takroriy so'rovlar 0ms kechikishda darhol qaytariladi.
7. **Speculative Parallel Hedging:** Asosiy provayder sekinlashsa (>3.8s), zaxira provayder avtomatik poygaga kirishib uzoq kutishni butunlay yo'qotadi.
8. **Dinamik Provayderlar Benchmarking:** `/api/benchmarks/results` va `/api/free-provider-rankings` real tok/s va TTFT o'lchovlariga ko'ra dinamik podiumni yangilaydi.
9. **Universal Agent HP DAG Simulyatori:** `/api/universal-agent/simulate` multi-step avtonom to'lqinlarni 100% sinovdan o'tkazadi.

---

## ⚡ Virtual Kombolar (Smart Combos)

Ushbu modellarni Universal Agent yoki Cursor'da model nomi sifatida ko'rsatishingiz mumkin:

* **`extra/auto-free`** — Tizimdagi eng sifatli va tezkor bepul modelga yo'naltiradi (DeepSeek $\to$ Groq $\to$ SambaNova $\to$ Gemini Flash $\to$ Cerebras $\to$ Pollinations).
* **`extra/free-coding`** — Dasturlash va kod yozishga ixtisoslashgan modellar zanjiri (Codestral $\to$ Qwen 2.5 Coder $\to$ Llama 3.3 70B $\to$ Gemini 2.0 Flash).
* **`extra/free-fast`** — Agentlarning ichki tezkor operatsiyalari uchun 500-2000 tok/s tezlikdagi modellar (Cerebras Llama 8B $\to$ Groq Llama 8B $\to$ Gemini Flash Lite).
* **`extra/free-reasoning`** — Chuqur fikrlash, matematika va algoritmik tahlil (DeepSeek-R1 Official $\to$ SambaNova R1 $\to$ Groq R1).
* **`extra/free-vision`** — Rasm va multimodal vazifalar (Gemini 2.0 Flash $\to$ GPT-4o $\to$ OpenRouter Gemini Exp).
* **`extra/free-embedding`** — Vektorli xotira va qidiruv (1536-dim).

---

## 💻 Boshqa Dasturlarga Ulash

### 1. Python OpenAI SDK
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="elx-live-universal-agent-free-hub"
)

# Chat
response = client.chat.completions.create(
    model="extra/auto-free",
    messages=[{"role": "user", "content": "Salom, qanday yordam bera olasan?"}]
)
print(response.choices[0].message.content)

# Free Embeddings
emb = client.embeddings.create(
    model="extra/free-embedding",
    input=["Sun'iy intellekt agentlari arxitekturasi"]
)
print("Vector dims:", len(emb.data[0].embedding))
```

### 2. Cursor IDE / Cline / Roo Code / Claude Code
* **OpenAI Base URL:** `http://localhost:3000/v1`
* **API Key:** `elx-live-universal-agent-free-hub`
* **Model:** `extra/free-coding` yoki `extra/auto-free`

---

## 🩺 Provayderlar Diagnostikasi (CLI Health Check)

Barcha provayderlar va endpointlar holatini real vaqtda tekshirish:
```bash
npm run health
```

---

## 🧪 Avtomatlashtirilgan Testlar

Tizim ishonchliligini to'liq tekshirish:
```bash
npm test
```
Barcha **69 ta test** 100% yashil o'tadi (`69 passed, 0 failed`).

---

## 📄 Litsenziya
MIT License — Foydalanish, o'zgartirish va tarqatish mutlaqo bepul.

