const BASE = 'http://localhost:3000';
const AUTH_HEADER = {
  'Authorization': 'Bearer elx-live-universal-agent-free-hub',
  'Content-Type': 'application/json'
};

async function runStage12Verification() {
  console.log('--- Testing Stage 12 Enhancements ---');

  // 1. Health
  const hRes = await fetch(`${BASE}/health`);
  console.log('1. /health:', hRes.status, await hRes.json());

  // 2. Benchmarks Results
  const bRes = await fetch(`${BASE}/api/benchmarks/results`);
  const bData = await bRes.json();
  console.log(`2. /api/benchmarks/results: ${bRes.status}, count: ${bData.rankings?.length}`);
  console.log(`   Top 3 Podium:`, bData.rankings.slice(0, 3).map(r => `#${r.rank} ${r.name} (${r.benchmarkScore} ELO, ${r.speedTokPerSec} tok/s)`));

  // 3. Provider Rankings
  const rRes = await fetch(`${BASE}/api/free-provider-rankings`);
  const rData = await rRes.json();
  console.log(`3. /api/free-provider-rankings: ${rRes.status}, count: ${rData.rankings?.length}`);

  // 4. Probe Mock
  const pRes = await fetch(`${BASE}/api/benchmarks/probe/mock`, { method: 'POST' });
  const pData = await pRes.json();
  console.log(`4. Probe Mock:`, pData);

  // 5. Test Live Chat Completion & Caching
  const chatBody = {
    model: 'extra/auto-free',
    messages: [{ role: 'user', content: 'What is Extra LLM X?' }],
    temperature: 0.5
  };

  const t0 = Date.now();
  const cRes1 = await fetch(`${BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify(chatBody)
  });
  const lat1 = Date.now() - t0;
  const cData1 = await cRes1.json();
  const cacheHeader1 = cRes1.headers.get('X-ExtraLLMX-Cache');
  console.log(`5. Chat Call 1: HTTP ${cRes1.status} (${lat1}ms) - Cache: ${cacheHeader1}`);
  console.log(`   Reply Preview: ${cData1.choices?.[0]?.message?.content?.slice(0, 70)}...`);

  // Repeat for Cache HIT
  const t1 = Date.now();
  const cRes2 = await fetch(`${BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify(chatBody)
  });
  const lat2 = Date.now() - t1;
  const cacheHeader2 = cRes2.headers.get('X-ExtraLLMX-Cache');
  console.log(`6. Chat Call 2 (Repeat): HTTP ${cRes2.status} (${lat2}ms) - Cache: ${cacheHeader2}`);

  // 7. Cache Stats
  const cacheRes = await fetch(`${BASE}/api/cache/stats`);
  console.log('7. Cache Stats:', await cacheRes.json());

  console.log('--- ALL STAGE 12 CHECKS COMPLETED ---');
}

runStage12Verification().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
