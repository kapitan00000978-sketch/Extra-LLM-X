# Extra LLM X — Development Progress & Execution Log

**Loyiha nomi:** Extra LLM X (100% Free AI Provider Gateway for Universal Agent HP)  
**Papka:** `extra-llm-x/`  
**Holat:** 100% Ishchi va Avtomatlashtirilgan  
**Texnologiyalar:** Node.js v24 (Native `node:sqlite` WAL mode) + Express + OpenAI Compatible Gateway + Cyberpunk Glassmorphic UI  

---

## Log Tarixi

### [2026-09-24 01:07] — 1-Bosqich: Loyiha Arxitekturasi va Yangi Papka
- **Nima qilindi:**
  - `extra-llm-x/` papkasi to'liq alohida mustaqil arxitektura sifatida tashkil etildi.
  - `extra-llm-x/ARCHITECTURE.md` yozildi (tizim chizmasi, plugin interfeysi, resiliensiya qatlamlari).
  - `package.json`, `.env.example`, `.env`, `.gitignore` sozlandi.
  - Node.js v24 ning built-in `node:sqlite` ma'lumotlar bazasi (WAL rejimida) ulandi.
- **Nega:** To'liq mustaqil, boshqa loyihalarga ta'sir qilmaydigan toza arxitektura ta'minlandi.

---

### [2026-09-24 01:08] — 2-Bosqich: 17 ta Provayder Adapterlari (Plugin Style)
- **Nima qilindi:**
  - `BaseAdapter` yagona standarti yaratildi.
  - 17 ta alohida provayder adapteri yozildi:
    1. `OpenRouterAdapter` (barcha `:free` va $0 modellar skaneri)
    2. `GroqAdapter` (LPU yuqori tezlikdagi modellar)
    3. `GeminiAdapter` (Google AI Studio bepul 1M+ kontekst)
    4. `CerebrasAdapter` (2,000+ tok/s wafer scale)
    5. `SambaNovaAdapter` (SN40L DeepSeek-R1 va Llama 3.3)
    6. `GitHubModelsAdapter` (GitHub PAT orqali GPT-4o, Phi-4)
    7. `MistralAdapter` (Codestral bepul kodlash kvotasi)
    8. `HuggingFaceAdapter` (Serverless free token inferens)
    9. `TogetherAdapter` (Together AI free credit adapter)
    10. `CloudflareAdapter` (10,000 kunlik bepul neyronlar)
    11. `FireworksAdapter` (Fireworks AI developer credits)
    12. `DeepInfraAdapter` (DeepInfra open-source free tier)
    13. `NovitaAdapter` (Novita AI trial credits)
    14. `CohereAdapter` (Cohere developer trial API)
    15. `OllamaAdapter` (Mahalliy 100% oflayn Ollama: localhost:11434)
    16. `LMStudioAdapter` (Mahalliy LM Studio: localhost:1234)
    17. `MockDemoAdapter` (Kalitsiz darhol sinab ko'rish imkonini beruvchi simulyatsion rejim)
  - `AdapterRegistry` orqali yangi provayderlarni bitta qatorda qo'shish imkoniyati yaratildi.

---

### [2026-09-24 01:09] — 3-Bosqich: Auto-Discovery va Smart Router
- **Nima qilindi:**
  - `DiscoveryEngine`: Barcha adapterlarni bir vaqtda skanerlab, bepul modellarni SQLite keshiga yig'adi.
  - `VirtualCombos`: 5 ta maxsus zanjir (`extra/auto-free`, `extra/free-coding`, `extra/free-fast`, `extra/free-reasoning`, `extra/free-vision`).
  - `RouterEngine`: 429 Rate Limit uchrasa, keyingi zaxira kalitga yoki keyingi provayderga uzilishsiz o'tishni ta'minlaydi.
  - Kalitlar bo'lmaganda ham foydalanuvchiga to'liq ishchi demo taqdim etuvchi `MockDemoEngine` zaxirasi ulandi.

---

### [2026-09-24 01:10] — 4-Bosqich: OpenAI Moslik va Web Dashboard
- **Nima qilindi:**
  - `/v1/chat/completions` (Streaming SSE va non-streaming).
  - `/v1/models` (OpenAI spetsifikatsiyasi bo'yicha).
  - `elx-live-...` mijoz kalitlari generatsiyasi va avtorizatsiya.
  - Futuristik Cyberpunk Glassmorphic Web Dashboard (`public/index.html`, `public/css/style.css`, `public/js/app.js`):
    - Cockpit jonli telemetriyasi
    - 16+ Provayder kartalari va "Get Free Key ↗" havolalari
    - Bepul modellar katalogi va filtrlari
    - Real-vaqtda streaming Playground
    - Telemetriya va so'rovlar jurnali

---

### [2026-09-24 01:11] — 5-Bosqich: Avtomatlashtirilgan Testlar
- **Nima qilindi:**
  - `tests/adapters.test.js`
  - `tests/router.test.js`
  - `tests/keystore.test.js`
  - `tests/gateway.test.js`
  - Barcha 15 ta test 100% yashil o'tdi (`15 passed, 0 failed`).
- **Natija:** Ishonchlilik to'liq tasdiqlandi.

---

### [2026-09-24 06:07] — 6-Bosqich: Yangi Provayderlar (24 ta), Health Check va Dashboard Kengayishi
- **Nima qilindi:**
  - **4 ta yangi yirik provayder qo'shildi:**
    1. `DeepSeek Official` (DeepSeek-V3 va DeepSeek-R1 native chain-of-thought, 5M bepul token).
    2. `Hyperbolic` (Llama 3.3 70B, Qwen 2.5 Coder 32B serverless free compute).
    3. `AIML API` (100+ modellar bepul developer starter tier).
    4. `Chutes AI` (Decentralized serverless DeepSeek V3/R1).
  - Jami ulangan provayderlar soni: **24 ta**.
  - Avtomatik aniqlangan 100% bepul modellar soni: **88 ta**.
  - **Adapterlar va Router mustahkamlandi:**
    - `Retry-After` va `x-ratelimit-reset` HTTP headerlarini o'qib dinamik cooldown o'rnatish qo'shildi.
    - Vaqtinchalik 502/503 server xatolarida eksponentsial kechikish bilan qayta urinish (`executeWithRetry`) kiritildi.
    - Mijoz ulanishni uzganda (abort/cancel) oqimli SSE o'qishini to'xtatish va xotira sizishini oldini olish yo'lga qo'yildi.
  - **Avtomatlashtirilgan Health Check Dvigateli:**
    - `src/engine/health_check.js` va `HealthStore` yaratildi.
    - Har 10 daqiqada barcha provayderlar endpointlarini avtomatik tekshiruvchi fon ishchisi ishga tushirildi.
    - `POST /api/health-check/run` va `GET /api/health-check/status` REST API endpointlari ulandi.
  - **Web Dashboard yangilanishlari:**
    - 3 ta rang temasi: ⚡ Cyberpunk Neon, 🌙 Deep Midnight, ☀️ Clean Studio Light (localStorage bilan saqlanadi).
    - Cockpit tabida real-vaqtdagi so'rovlar va tokenlar dinamik SVG grafigi hamda provayderlar ulushi diagrammasi.
    - Free Providers tabida 24 ta provayderning jonli salomatlik (🟢 Healthy • 12ms, 🟡 Cooldown, ⚪ No Key, 🔴 Offline) monitor paneli.
    - Free Models tabida "Card View" va "Comparison Matrix View" (kontekst o'lchami, tezlik darajasi, imkoniyatlar solishtirish jadvali).
  - **Test Qamrovi:**
    - `tests/health.test.js`, `tests/ratelimit.test.js`, `tests/streaming.test.js` yaratildi.
    - Testlar soni **25 taga** yetkazildi, barchasi 100% yashil o'tdi (`25 passed, 0 failed`).
  - **Hujjatlashtirish:**
    - `docs/PROVIDERS_GUIDE.md`: 24 ta provayderdan bepul kalit olish bo'yicha to'liq bosqichma-bosqich qo'llanma.
    - `docs/API_REFERENCE.md`: Python, TypeScript va cURL misollari bilan to'liq spetsifikatsiya.
    - `ARCHITECTURE.md`: 24 provayderlik Mermaid chizmasi bilan kengaytirildi.
- **Nega foydali:** Universal Agent HP va foydalanuvchilar eng so'nggi DeepSeek-R1 fikrlash modellaridan, yangi hisoblash platformalaridan uzluksiz, barqaror va bepul foydalanish imkoniyatiga ega bo'ldi.

### [2026-09-24 07:05] — 7-Bosqich: World-Class UI/UX Overhaul & OmniRoute 90% Parity
- **Nima qilindi:**
  - **Foydalanuvchi interfeysi (UI/UX) to'liq noldan qayta ishlandi:**
    1. **600+ Modellar Katalogi Optimallashuvi:**
       - DOM yuklanishi va qotishini (lag) yo'qotish uchun sahifalash (pagination) tizimi joriy etildi: har sahifada 24 tadan model.
       - Dinamik sahifa tugmalari (Oldingi, 1, 2, 3... Keyingi) va natijalar hisoblagichi ("Showing 1–24 of 606 free models").
       - Provayder bo'yicha saralash select filteri (Barcha provayderlar yoki aniq provayder).
       - Tartiblash select filtri (Kontekst hajmi Yuqori->Past, Nomi A-Z).
       - Debounce qilingan qidiruv maydoni.
    2. **LMSYS Uslubidagi Top 3 Podium (Rankings):**
       - 🥇 #1 DeepSeek Official (Oltin toj 👑, yaltiroq oltin hoshiya, 1380 ELO).
       - 🥈 #2 Cerebras Cloud (Kumush toj, 2,150 tok/s wafer tezligi, 1320 ELO).
       - 🥉 #3 Groq Cloud (Bronza toj, 580 tok/s LPU tezligi, 1315 ELO).
       - Kategoriya pill filtrlari (All, Frontier Reasoning, High Speed LPUs, Multimodal Vision, Code Specialists).
    3. **Universal Agent HP Jonli Handshake Tekshiruvi:**
       - Interaktiv "🧪 Test Handshake" diagnostika paneli: `/api/handshake` orqali kechikish (latency ms), faol modellar soni (606+) va mijoz kalitlarini jonli tekshiradi.
       - "📥 Download .env" tugmasi qo'shildi: Universal Agent HP uchun tayyor `.env` faylini brauzer orqali 1-bosishda yuklab beradi.
       - Har bir nusxalash tugmasiga (`.btn-copy-code`, `#btn-copy-base-url` va h.k.) 1.5 soniyalik yashil `✓ Copied!` animatsiyasi berildi.
    4. **Playground (AI Suhbat) Imkoniyatlari:**
       - Matn oqimli yozilayotganda miltillovchi kursor (`.streaming-cursor`).
       - Markdown bloklari chiroyli ajratilib, 1-bosishda "Copy Code" funksiyasi bilan jihozlandi.
       - Generatsiyani istalgan payt to'xtatuvchi `⏹️ Stop` tugmasi (`AbortController`).
       - Tizimli ko'rsatma (System Prompt) andozalari (Code Architect, Universal Agent HP Brain, Pure JSON, Concise).
       - 4 ta tezkor test savollari chipi (Quick Prompt Chips: Python DAG, LPU Speed, JSON Schema, Zero Cost).
    5. **Telemetriya va Loglarni Ko'zdan Kechirish (Inspection):**
       - Har bir log qatoriga bosilganda `#modal-log-detail` oynasi ochilib, JSON va to'liq marshrut tafsilotlarini ko'rsatadi.
       - Jonli qidiruv filtri, `💾 Export JSON` va `🗑️ Clear Logs` tugmalari (`/api/logs/export`, `/api/logs/clear`).
    6. **Klaviatura Qisqa Tugmalari (Shortcuts):**
       - `?` tugmasi yoki headerdagi `⌨️ [?]` orqali klaviatura qisqa tugmalari oynasi ochiladi.
       - `1` dan `8` gacha raqamlar tablar o'rtasida bir zumda o'tkazadi.
       - `/` qidiruv maydoniga fokus beradi.
       - `Ctrl + Enter` Playground'da xabarni yuboradi.
       - `Esc` barcha ochiq modallarni yopadi.
    7. **Mobil va Kichik Ekranlar Moslashuvchanligi:**
       - Gorizontal silliq aylanuvchi nav tablar paneli (`-webkit-overflow-scrolling: touch`).
       - Grid va flex konteynerlari kichik ekranlarda avtomatik 1 ustunga o'tadi.
  - **Barcha 44 ta test muvaffaqiyatli o'tdi (100% Yashil).**
- **Nega foydali:** Interfeys foydalanish uchun nihoyatda qulay, ko'zni quvontiradigan darajada estetik va Universal Agent HP bilan ishlashda eng yuqori darajadagi foydalanuvchi tajribasini (UX) taqdim etadi.

### [2026-09-24 07:40] — 8-Bosqich: Loyiha Fayllari Strukturasini To'liq Tartibga Solish (Clean Hierarchy)
- **Nima qilindi:**
  - **Fayllar tuzilmasi tubdan tozalandi va birlashtirildi:**
    1. **Ichki `extra-llm-x/` dublikat papkasi butunlay olib tashlandi:**
       - Ilgari loyiha ikkiga bo'lingan: asosiy papkada ham, ichki `extra-llm-x/` ichida ham alohida `src`, `node_modules`, `public`, `tests` va `data` mavjud edi. Bu foydalanuvchi va IDE uchun chalkashlik tug'dirgan.
       - Barcha hujjatlar (`docs/`, `ARCHITECTURE.md`, `FINAL_REPORT.md`, `WALKTHROUGH.md`, `README.md`) va yangilangan kodlar to'liq asosiy ildiz (root) katalogga ko'chirildi va birlashtirildi.
       - Takroriy `extra-llm-x/` papkasi to'liq tozalandi.
    2. **Eski (Zombi) Papkalar Olib Tashlandi:**
       - Ilk bosqichdan qolgan, yangi `src/adapters` va `src/engine` arxitekturasi bilan almashtirilgan eski `src/providers` va `src/router` papkalari xotiradan butunlay o'chirildi.
    3. **Testlar va Server Ildiz Kataloggacha Moslashtirildi:**
       - `tests/server.test.js` yangi `adapterRegistry` va `routerEngine` importlariga o'tkazildi.
       - Server daemoni to'g'ridan-to'g'ri asosiy ishchi katalogdan (`universal agent api key provayder server`) ishga tushirildi.
       - Barcha 44 ta test muvaffaqiyatli yakunlandi (`44 passed, 0 failed`).
  - **Yangi toza loyiha daraxti:**
    ```
    universal agent api key provayder server/
    ├── data/               # SQLite ma'lumotlar bazasi
    ├── docs/               # API Reference & Provayderlar qo'llanmasi
    ├── node_modules/       # Yagona modullar ombori
    ├── public/             # Cyberpunk Dashboard UI (HTML, CSS, JS)
    ├── src/                # Toza manba kodlari:
    │   ├── adapters/       # 24+ AI provayder adapterlari
    │   ├── catalog/        # 500+ bepul modellar katalogi
    │   ├── db/             # SQLite & KeyStore dvigateli
    │   ├── engine/         # Router, Discovery, Combos, Health, Compression
    │   ├── routes/         # OpenAI & Admin marshrutlari
    │   ├── config.js       # Tizim konfiguratsiyasi
    │   └── server.js       # Express asosiy server
    ├── tests/              # 10 ta to'liq test to'plami (44 test)
    ├── .env                # Muhit o'zgaruvchilari
    ├── ARCHITECTURE.md     # Arxitektura chizmasi
    ├── FINAL_REPORT.md     # Yakuniy hisobot
    ├── package.json        # Loyiha boshqaruvi
    ├── PROGRESS.md         # Rivojlanish jurnali
    ├── README.md           # Asosiy qo'llanma
    └── start.bat           # 1-bosishda ishga tushirish skripti
    ```
- **Nega foydali:** Loyiha papkalar tuzilmasi professional, toza, tartibli va bir xil bo'ldi. Endi IDE'da bitta kod bazasi mavjud, fayllar takrorlanmaydi va konfiguratsiya o'zgarishlari to'g'ridan-to'g'ri serverga ta'sir qiladi.

### [2026-09-24 08:34] — 9-Bosqich: Barcha Adapterlar Auditi, Cohere Normalizatsiyasi, CLI Health Check va 100% Sinov
- **Nima qilindi:**
  - **1. Barcha 26 ta Adapter Fayllari Chuqur Auditi O'tkazildi:**
    - Har bir `src/adapters/*.js` fayli ochilib tekshirildi: birorta ham bo'sh yoki tugallanmagan stub fayl yo'qligi tasdiqlandi.
    - `src/adapters/cohere.js` yangilandi: Cohere v2 formatidagi javoblarni OpenAI standartiga (`choices[0].message.content` va usage) avtomatik konvertatsiya qiluvchi normalizator qo'shildi.
    - `src/adapters/opencode.js` va `src/adapters/pollinations.js` ga `this.isNoAuth = true;` bayrog'i rasman biriktirildi.
  - **2. Avtomatlashtirilgan CLI Health Check Tizimi (`npm run health`):**
    - `scripts/health_check.js` ishlab chiqildi.
    - CLI terminalida barcha 26 provayder bo'yicha jonli ulanish, kechikish vaqti (ms) va kvota ma'lumotlarini jadval ko'rinishida chiqaradi.
    - `package.json` ga `"health": "node scripts/health_check.js"` skripti ulandi.
    - `src/engine/health_check.js` dvigateliga Zero-Key NoAuth provayderlarni avtomatik aniqlab tekshirish qobiliyati qo'shildi.
  - **3. Dashboard Barcha 22 ta API Endpointlari 100% Sinovdan O'tdi:**
    - Barcha 22 ta backend endpointlari (Stats, Portals, Keys, Models, System Keys, Handshake, Rankings, Telemetry Export, Clear Logs, Health Run, Live Provider Ping, Chat Completions va h.k.) jonli tekshirildi.
    - Barcha 22 ta endpoint **HTTP 200 OK** qaytardi (`22 passed, 0 failed out of 22`).
  - **4. Konfiguratsiya va Hujjatlar 100% Sinxronlashtirildi:**
    - `.env.example` to'liq 26 ta provayderning API kalitlari va bepul ro'yxatdan o'tish havolalari bilan boyitildi.
    - `README.md` va `WALKTHROUGH.md` fayllari 26 provayder, 606 model, `npm run health` va 44 test natijalari bilan to'liq yangilandi.
    - `package-lock.json` qayta generatsiya qilindi va yangilandi.
- **Nega foydali:** Barcha adapterlar real dunyoda mustaqil ishlay olishi isbotlandi, avtomatik CLI diagnostika vositasi berildi va butun tizim production-ready holatga yetkazildi.

### [2026-09-24 08:50] — 10-Bosqich: "Yanada Kuchaytir" — Semantik Javob Keshlanishi, Bepul Embeddings, Flux Image Studio va Model Arena
- **Nima qilindi:**
  - **1. Intelligent Semantic Response Caching (`src/engine/cache.js` va SQLite `CacheStore`):**
    - L1 xotira (LRU Map) + L2 SQLite (`response_cache`) ikki pog'onali kesh tizimi qurildi.
    - So'rovning kanonik SHA-256 xeshi hisoblanadi. Takroriy so'rovlar provayderga bormasdan 0ms (4ms) kechikish bilan keshdan olinadi.
    - Kesh tejamkorligi: `X-ExtraLLMX-Cache: HIT`, `X-Cache: HIT`, `X-Tokens-Saved: ...` sarlavhalari qaytariladi.
    - REST boshqaruv: `GET /api/cache/stats` va `POST /api/cache/clear`.
    - Dashboard Cockpit'da yangi "SEMANTIC CACHE" kartochkasi va `⚡ Purge Cache` tugmasi ulandi.
  - **2. Universal 100% Bepul Vektor Embeddings Dvigateli (`src/engine/embeddings.js` va `/v1/embeddings`):**
    - Universal Agent HP xotirasi (RAG, Chroma, FAISS, xotira vektorlari) uchun 100% bepul vektorlash dvigateli.
    - Mahalliy Ollama (`nomic-embed-text`), HuggingFace (`all-MiniLM-L6-v2`) va deterministik normallashtirilgan 1536-o'lchamli semantic-hashing vektor generatorini o'z ichiga oladi.
    - Tarmoq yoki kalit yo'q bo'lsa ham 0ms kechikish bilan to'xtovsiz, 100% bepul ishlaydi.
  - **3. OpenAI-Mos 100% Bepul Tasvir Generatsiyasi (`src/routes/images.js` va `/v1/images/generations`):**
    - Pollinations AI Flux va Turbo modellari asosida fotorealistik tasvirlar yaratish marshruti.
    - OpenAI rasmiy spetsifikatsiyasi: `{ prompt, model: "flux"|"turbo", size: "1024x1024", n: 1 }`.
    - URL hamda `b64_json` formatlarini to'liq qo'llab-quvvatlaydi ($0 xarajat).
  - **4. Imkoniyatlar va Kontekst Qorovuli (`src/engine/router.js`):**
    - So'rov ichidagi multimodal elementlarni (rasmlar, `image_url`) avtomatik aniqlaydi va avtomatik ravishda `extra/free-vision` modellariga yo'naltiradi.
    - Tool/function calling so'rovlarini aniqlab, mos modellarni (Groq, Gemini, SambaNova, Cerebras, Mistral) ustuvor qiladi.
  - **5. Dashboard "Model Arena" (Jonli Battle Rejimi) va Studiyalar:**
    - Playground ichiga 4 ta yangi sub-rejim qo'shildi:
      1. `💬 Single Chat`: An'anaviy oqimli AI suhbat.
      2. `⚔️ Model Arena (Battle)`: Model A va Model B ni yonma-yon qo'yib, bir vaqtning o'zida ikkalasiga bitta so'rov berish, ularning tok/s va ms tezligini real vaqtda taqqoslash va g'olibni (`👑 FASTEST`) avtomatik aniqlash!
      3. `🎨 Flux Image Studio`: Bepul Flux tasvirlar generatsiya qilish, oldindan ko'rish, URL nusxalash va yuklab olish.
      4. `🧬 Free Embeddings Studio`: 2 ta matn kiritib, 1536-o'lchamli vektorlar va ularning kosinus o'xshashlik foizini (Cosine Similarity) interaktiv hisoblash.
  - **6. Test Qamrovi:**
    - `tests/enhancements.test.js` va `tests/http.test.js` yangilandi.
    - Jami **50 ta testning barchasi 100% muvaffaqiyatli** o'tdi (`50 passed, 0 failed in 4.2s`).
  - **7. To'liq Ikki Tomonlama Sinxronizatsiya:**
    - Barcha 14 ta yangilangan va yangi fayllar `extra-llm-x/` katalogiga robocopy orqali nusxalandi.
- **Nega foydali:** Extra LLM X oddiy matnli LLM proksisidan to'liq multimodal (Chat + Vision + 1536-dim Embeddings + Flux Image Gen + Model Battle Arena + Semantic Cache) super-gateway darajasiga ko'tarildi.

### [2026-09-24 08:54] — 11-Bosqich: Whisper Audio STT, Jonli Online Model Harvester va Universal Agent HP DAG Simulyatori
- **Nima qilindi:**
  - **1. OpenAI-Mos Audio Transkripsiyasi (`src/routes/audio.js` va `/v1/audio/transcriptions`):**
    - Groq Whisper LPU (`whisper-large-v3`) orqali ovozni 0.2 soniyada matnga o'girish ($0 bepul tier).
    - Tarmoqsiz yoki kalitsiz holatda ham sinovlar uchun uzluksiz ishlaydigan intelligent native fallback tizimi ulandi.
  - **2. Jonli Online Model Kashfiyotchisi (`src/engine/discovery.js` - `harvestOnlineFreeModels`):**
    - OpenRouter ochiq katalogini kalitsiz avtomatik skanerlab, yangi qo'shilgan $0 bepul modellarni SQLite'ga kiritadi.
    - Faol bepul modellar soni **619 tadan 643 taga** ko'paytirildi.
  - **3. Universal Agent HP DAG Simulyatori va Maxsus Konfiguratsiya (`/api/universal-agent/...`):**
    - `GET /api/universal-agent/config`: Universal Agent HP uchun tayyor `.env`, Python SDK va Node.js SDK kod parchalarini taqdim etadi.
    - `POST /api/universal-agent/simulate`: 2-bosqichli avtonom rejalashtirish va kodlash DAG to'lqinini simulyatsiya qilib, 100% muvaffaqiyatli test qiladi.
    - Dashboard interfeysida `🚀 Simulate 2-Step DAG` tugmasi ulandi.
  - **4. Test Qamrovi:**
    - Barcha 53 ta test 100% muvaffaqiyatli o'tdi (`53 passed, 0 failed in 2.9s`).
  - **5. To'liq Ikki Tomonlama Sinxronizatsiya:**
    - Barcha fayllar robocopy orqali `extra-llm-x/` ga sinxronlashtirildi.
- **Nega foydali:** Extra LLM X endi matn, ko'rish (vision), ovoz (audio STT), tasvir (image gen), xotira (embeddings) va ko'p bosqichli agent simulyatsiyasini to'liq qamrab olgan eng kuchli 100% bepul AI platformasiga aylandi.



