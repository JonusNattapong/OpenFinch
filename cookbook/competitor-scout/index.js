#!/usr/bin/env node

/**
 * Competitor Scout Recipe
 *
 * Multi-step research workflow: search, fetch, and extract.
 *
 * Usage:
 *   export OPENFINCH_API_URL=http://localhost:8787
 *   node index.js
 *
 * Requires:
 *   - OpenFinch API running
 *   - SearXNG running
 *   - Ollama or another LLM provider configured
 */

const BASE = process.env.OPENFINCH_API_URL || "http://localhost:8787";
const LLM_PROVIDER = process.env.LLM_PROVIDER || "ollama";
const QUERY = process.argv[2] || "open source web agent tools 2025";

async function main() {
  console.log(`=== Competitor Scout: "${QUERY}" ===\n`);

  // Step 1: Search
  console.log("Step 1: Searching...");
  const searchRes = await fetch(`${BASE}/v1/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, limit: 3 }),
  });
  const searchData = await searchRes.json();
  if (searchData.error) {
    console.error("Search error:", searchData.error);
    console.log("\nNote: Search requires SearXNG. Try: docker compose up -d searxng");
    process.exit(1);
  }
  console.log(`   Found ${searchData.results?.length || 0} results`);

  // Step 2: Fetch top result
  if (!searchData.results?.length) {
    console.log("\nNo results found. SearXNG may still be starting up.");
    process.exit(0);
  }

  const topUrl = searchData.results[0].url;
  console.log(`\nStep 2: Fetching top result: ${topUrl}`);
  const fetchRes = await fetch(`${BASE}/v1/fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: topUrl, format: "markdown" }),
  });
  const fetchData = await fetchRes.json();
  if (fetchData.error) {
    console.log(`   Fetch skipped (${fetchData.error})`);
    process.exit(0);
  }
  console.log(`   Fetched ${fetchData.content?.length || 0} chars`);

  // Step 3: Extract key info
  console.log(`\nStep 3: Extracting key information using ${LLM_PROVIDER}...`);
  const extractRes = await fetch(`${BASE}/v1/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: topUrl,
      prompt: "Extract the main topic, key points, and any tool/product names mentioned",
      provider: LLM_PROVIDER,
    }),
  });
  const extractData = await extractRes.json();
  if (extractData.error) {
    console.log(`   Extract skipped (${extractData.error})`);
    process.exit(0);
  }

  console.log(`\nExtracted Data:`);
  console.log(JSON.stringify(extractData.data, null, 2));
  console.log(`\nDone (${extractData.tookMs}ms)`);
}

main().catch(console.error);
