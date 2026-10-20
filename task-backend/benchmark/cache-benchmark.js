// benchmark/cache-benchmark.js
// ─────────────────────────────────────────────────────────────────────────────
// Practical 9 — Performance Testing: Cache vs No-Cache response times
//
// Usage:
//   1. Start the backend:   cd task-backend && npm run dev
//   2. Register/login once and paste your JWT token below.
//   3. Run:                 node benchmark/cache-benchmark.js
//
// What this script does:
//   - Makes 3 requests to GET /tasks with a warm cache (reads already cached)
//   - Waits 65 s for the cache TTL to expire
//   - Makes 3 requests to GET /tasks after the TTL expires (DB hits)
//   - Records response times and prints averages
//
// IMPORTANT:
//   Replace TOKEN below with a valid JWT from POST /auth/login.
//   The token expires in 1 hour. Run this script within that window.
// ─────────────────────────────────────────────────────────────────────────────

const https = require('https');
const http  = require('http');

// ─── CONFIGURE THESE ──────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:5000';
const TOKEN    = 'PASTE_YOUR_JWT_TOKEN_HERE'; // from POST /auth/login
const ROUNDS   = 3; // readings per phase
const TTL_MS   = 61_000; // slightly > 60 s cache TTL to guarantee expiry
// ─────────────────────────────────────────────────────────────────────────────

function get(url, token) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const t0  = performance.now();
    const req = lib.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const elapsed = performance.now() - t0;
        try {
          const data = JSON.parse(body);
          resolve({ elapsed, source: data.source, status: res.statusCode });
        } catch {
          resolve({ elapsed, source: 'unknown', status: res.statusCode });
        }
      });
    });
    req.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  if (TOKEN === 'PASTE_YOUR_JWT_TOKEN_HERE') {
    console.error('ERROR: Replace TOKEN in benchmark.js with a real JWT token.');
    process.exit(1);
  }

  console.log('=============================================================');
  console.log('  Practical 9 — Cache Benchmark');
  console.log('=============================================================');
  console.log(`  Endpoint: ${BASE_URL}/tasks`);
  console.log(`  Rounds per phase: ${ROUNDS}`);
  console.log('');

  // ── Phase 1: Warm-up / first call to ensure data is in DB ────────────────────
  console.log('--- Phase 0: Warming up (first call may miss cache) ---');
  const warmup = await get(`${BASE_URL}/tasks`, TOKEN);
  console.log(`  Warm-up: ${warmup.elapsed.toFixed(2)} ms  [source: ${warmup.source}]`);

  // Wait briefly so the warm-up response is cached
  await sleep(200);

  // ── Phase 1: CACHED responses ─────────────────────────────────────────────────
  console.log('\n--- Phase 1: CACHED requests (cache should be warm) ---');
  const cachedTimes = [];
  for (let i = 1; i <= ROUNDS; i++) {
    const r = await get(`${BASE_URL}/tasks`, TOKEN);
    cachedTimes.push(r.elapsed);
    console.log(`  Reading ${i}: ${r.elapsed.toFixed(2)} ms  [source: ${r.source}]`);
    await sleep(100);
  }

  const cachedAvg = cachedTimes.reduce((a, b) => a + b, 0) / cachedTimes.length;
  console.log(`  Average (cached): ${cachedAvg.toFixed(2)} ms`);

  // ── Wait for TTL to expire ────────────────────────────────────────────────────
  console.log(`\n--- Waiting ${TTL_MS / 1000}s for cache TTL to expire... ---`);
  await sleep(TTL_MS);
  console.log('  TTL expired. Cache should be empty now.');

  // ── Phase 2: UNCACHED (DB) responses ─────────────────────────────────────────
  console.log('\n--- Phase 2: UNCACHED requests (first hit goes to MongoDB) ---');
  const dbTimes = [];
  for (let i = 1; i <= ROUNDS; i++) {
    const r = await get(`${BASE_URL}/tasks`, TOKEN);
    dbTimes.push(r.elapsed);
    console.log(`  Reading ${i}: ${r.elapsed.toFixed(2)} ms  [source: ${r.source}]`);
    // Don't sleep long between requests; but first one will miss cache
    // Subsequent ones will be served from the newly-populated cache
    await sleep(50);
  }

  const dbAvg = dbTimes.reduce((a, b) => a + b, 0) / dbTimes.length;
  console.log(`  Average (first-miss + re-cached): ${dbAvg.toFixed(2)} ms`);

  // ── Debug stats ───────────────────────────────────────────────────────────────
  const statsRes = await get(`${BASE_URL}/debug/cache`, TOKEN);
  const statsRaw = await new Promise((resolve) => {
    http.get(`${BASE_URL}/debug/cache`, { headers: { Authorization: `Bearer ${TOKEN}` } }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => resolve(body));
    });
  });
  console.log('\n--- Cache Stats (from /debug/cache) ---');
  try {
    const stats = JSON.parse(statsRaw);
    console.log(`  Hits:   ${stats.hits}`);
    console.log(`  Misses: ${stats.misses}`);
    console.log(`  Keys:   ${JSON.stringify(stats.keys)}`);
  } catch {
    console.log('  (Could not parse stats response)');
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n=============================================================');
  console.log('  SUMMARY');
  console.log('=============================================================');
  console.log(`  Cached avg:   ${cachedAvg.toFixed(2)} ms`);
  console.log(`  DB-miss avg:  ${dbAvg.toFixed(2)} ms`);
  console.log(`  Speedup:      ${dbAvg > 0 ? (dbAvg / cachedAvg).toFixed(2) : 'N/A'}x faster with cache`);
  console.log('=============================================================');
}

run().catch((err) => {
  console.error('Benchmark failed:', err.message);
  process.exit(1);
});
