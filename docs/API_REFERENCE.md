# Extra LLM X вЂ” REST & OpenAI API Reference

Extra LLM X exposes an OpenAI-compatible API on port `3000`. Any SDK, tool, or library designed for OpenAI (`openai-python`, `openai-node`, LangChain, LlamaIndex, Cursor, Cline, Claude Code, AI Agents) can interact with Extra LLM X by pointing `base_url` to `http://localhost:3000/v1`.

---

## 1. Authentication

Every request to `/v1/*` must include a Bearer API Key generated in the Extra LLM X dashboard or the default out-of-the-box key:

```http
Authorization: Bearer elx-live-master-free-hub
```

Admin endpoints (`/api/*`) are accessible locally for dashboard operation.

---

## 2. OpenAI-Compatible Endpoints

### `POST /v1/chat/completions`
Executes chat completions with streaming (Server-Sent Events) or standard JSON responses.

#### Request Headers
| Header | Value | Required |
|---|---|---|
| `Content-Type` | `application/json` | Yes |
| `Authorization` | `Bearer <API_KEY>` | Yes |

#### Request Body Parameters
| Parameter | Type | Default | Description |
|---|---|---|---|
| `model` | string | `'extra/auto-free'` | Model ID or Combo alias (`extra/auto-free`, `extra/free-coding`, `extra/free-fast`, `extra/free-reasoning`, `extra/free-vision`, or `<provider>/<model>`) |
| `messages` | array | `[]` | Array of message objects `[{ role: "user"|"assistant"|"system", content: "..." }]` |
| `stream` | boolean | `false` | Enable real-time Server-Sent Events (SSE) streaming |
| `temperature` | number | `0.7` | Sampling temperature between 0 and 2 |
| `max_tokens` | number | `null` | Max completion tokens to generate |
| `tools` | array | `null` | Optional tool / function definitions |
| `tool_choice` | string/object | `null` | Optional tool execution directive |

#### Custom Response Headers
Extra LLM X appends live telemetry metadata to every response:
- `X-ExtraLLMX-Provider`: The provider that fulfilled the request (e.g. `groq`, `gemini`, `deepseek`).
- `X-ExtraLLMX-Actual-Model`: The exact upstream model invoked.
- `X-ExtraLLMX-Fallback`: `true` if auto-failover occurred due to rate limit or outage.
- `X-ExtraLLMX-Latency-Ms`: Total execution latency in milliseconds.

---

## 3. Code Examples

### cURL (Streaming)
```bash
curl -N http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer elx-live-master-free-hub" \
  -d '{
    "model": "extra/auto-free",
    "messages": [{"role": "user", "content": "Explain quantum computing in 2 sentences."}],
    "stream": true
  }'
```

### Python (`openai` SDK v1.0+)
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="elx-live-master-free-hub"
)

# 1. High-Speed Auto-Fallback Chat
response = client.chat.completions.create(
    model="extra/auto-free",
    messages=[{"role": "user", "content": "Write a fast Fibonacci function in Rust."}],
    stream=True
)

for chunk in response:
    content = chunk.choices[0].delta.content or ""
    print(content, end="", flush=True)

# 2. Deep Chain-of-Thought Reasoning (DeepSeek-R1)
reasoning_res = client.chat.completions.create(
    model="extra/free-reasoning",
    messages=[{"role": "user", "content": "Prove that the square root of 2 is irrational."}],
    stream=False
)
print("\n\nReasoning Result:\n", reasoning_res.choices[0].message.content)
```

### TypeScript / Node.js (`openai` NPM)
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'elx-live-master-free-hub',
});

async function main() {
  const stream = await client.chat.completions.create({
    model: 'extra/free-coding',
    messages: [{ role: 'user', content: 'Create a TypeScript debounce utility function' }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main();
```

---

## 4. Models & Diagnostics Endpoints

### `GET /v1/models`
Returns all active 100% free models and virtual combos in OpenAI standard list format:
```bash
curl http://localhost:3000/v1/models \
  -H "Authorization: Bearer elx-live-master-free-hub"
```

### `GET /health`
Returns gateway status and active free model count:
```bash
curl http://localhost:3000/health
```

### `POST /api/health-check/run`
Triggers an immediate diagnostic ping across all 24 connected AI providers and records latency and availability status.

### `GET /api/analytics/charts`
Returns aggregated time-series telemetry (requests per hour, token volume, provider share distribution).

