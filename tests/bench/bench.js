#!/usr/bin/env node

/**
 * OpenFinch Performance Benchmark
 *
 * Measures latency for key API endpoints.
 * Skips tests if services are unavailable.
 *
 * Usage: node tests/bench/bench.js
 *        pnpm bench
 *
 * Output: table format with p50/p95 timings.
 */

const BASE = process.env.OPENFINCH_API_URL || "http://localhost:8787";
const DEMO_SITE = process.env.DEMO_SITE_URL || "http://localhost:4173";
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const ITERATIONS = parseInt(process.env.BENCH_ITERATIONS || "3", 10);

const results = [];

async function measure(label, url, options = {}, iterations = ITERATIONS) {
  const timings = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      const res = await fetch(url, {
        method: options.method || "GET",
        headers: options.headers || {},
        body: options.body || undefined,
        signal: AbortSignal.timeout(options.timeout || 10000),
      });
      const took = performance.now() - start;
      if (res.ok) timings.push(took);
    } catch {
      // skip failed iterations
    }
  }

  if (timings.length === 0) {
    results.push({ label, status: "SKIP", p50: "-", p95: "-", avg: "-", min: "-", max: "-" });
    console.log(`  ⏭️  ${label} (unavailable)`);
    return;
  }

  timings.sort((a, b) => a - b);
  const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
  const p50 = timings[Math.floor(timings.length * 0.5)];
  const p95 = timings[Math.floor(timings.length * 0.95)];
  const min = timings[0];
  const max = timings[timings.length - 1];

  results.push({ label, status: "OK", p50: `${p50.toFixed(0)}ms`, p95: `${p95.toFixed(0)}ms`, avg: `${avg.toFixed(0)}ms`, min: `${min.toFixed(0)}ms`, max: `${max.toFixed(0)}ms` });
  console.log(`  ✅ ${label}: avg=${avg.toFixed(0)}ms p50=${p50.toFixed(0)}ms p95=${p95.toFixed(0)}ms`);
}

async function isAvailable(url, timeout = 3000) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    return res.ok;
  } catch { return false; }
}

async function isOllamaAvailable() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return false;
    const data = await res.json();
    return (data.models || []).length > 0;
  } catch { return false; }
}

async function main() {
  console.log("\n========================================");
  console.log("  OpenFinch Performance Benchmark");
  console.log("========================================\n");
  console.log(`API: ${BASE}`);
  console.log(`Demo Site: ${DEMO_SITE}`);
  console.log(`Iterations: ${ITERATIONS}`);
  console.log(`Ollama: ${OLLAMA_URL}\n`);

  const apiOk = await isAvailable(BASE);
  if (!apiOk) {
    console.log("  ❌ OpenFinch API not reachable. Start with: docker compose up -d\n");
    process.exit(1);
  }

  const demoSiteOk = await isAvailable(DEMO_SITE);
  const ollamaOk = await isOllamaAvailable();

  console.log(`  API: ${apiOk ? "✅" : "❌"} | Demo Site: ${demoSiteOk ? "✅" : "⏭️"} | Ollama: ${ollamaOk ? "✅" : "⏭️"}\n");

  // === API Benchmarks ===
  console.log("--- API Latency ---");
  await measure("GET /health", `${BASE}/health`);
  await measure("GET /health/live", `${BASE}/health/live`);
  await measure("GET /health/ready", `${BASE}/health/ready`);
  await measure("GET /health/detail", `${BASE}/health/detail`);

  if (demoSiteOk) {
    console.log("\n--- Fetch Latency ---");
    await measure("POST /v1/fetch (markdown)", `${BASE}/v1/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: `${DEMO_SITE}/`, format: "markdown" }),
      timeout: 15000,
    });
    await measure("POST /v1/fetch (products)", `${BASE}/v1/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: `${DEMO_SITE}/products`, format: "markdown" }),
      timeout: 15000,
    });

    if (ollamaOk) {
      console.log("\n--- Extract Latency ---");
      await measure("POST /v1/extract (Ollama)", `${BASE}/v1/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `${DEMO_SITE}/products`,
          prompt: "Extract all product names and prices",
          provider: "ollama",
        }),
        timeout: 60000,
        iterations: Math.min(ITERATIONS, 2), // extract is slow
      });
    }
  }

  console.log("\n--- Browser Latency ---");
  await measure("POST /v1/browser/session", `${BASE}/v1/browser/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ headless: true }),
    timeout: 15000,
    iterations: 1, // expensive, only 1
  }).then(async () => {
    // Clean up any created sessions (we just benchmark creation)
    try {
      const res = await fetch(`${BASE}/v1/browser/session`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
    } catch {}
  });

  // === Results Table ===
  console.log("\n========================================");
  console.log("  Results Summary");
  console.log("========================================");
  console.log(`  ${"Test".padEnd(35)} ${"Avg".padEnd(8)} ${"p50".padEnd(8)} ${"p95".padEnd(8)} ${"Min".padEnd(8)} ${"Max".padEnd(8)}`);
  console.log("  " + "-".repeat(75));
  for (const r of results) {
    if (r.status === "SKIP") {
      console.log(`  ${r.label.padEnd(35)} ${"SKIPPED".padEnd(40)}`);
    } else {
      console.log(`  ${r.label.padEnd(35)} ${r.avg.padEnd(8)} ${r.p50.padEnd(8)} ${r.p95.padEnd(8)} ${r.min.padEnd(8)} ${r.max.padEnd(8)}`);
    }
  }
  console.log();

  const failed = results.filter(r => r.status === "SKIP").length;
  process.exit(failed === results.length ? 1 : 0);
}

main().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
