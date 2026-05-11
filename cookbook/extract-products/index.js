#!/usr/bin/env node

/**
 * Extract Products Recipe
 *
 * Extracts structured product data from the OpenFinch Demo Store.
 *
 * Usage:
 *   export OPENFINCH_API_URL=http://localhost:8787
 *   node index.js
 *
 * Requires:
 *   - OpenFinch API running
 *   - Demo site running (pnpm demo:site)
 *   - Ollama or another LLM provider configured
 */

const BASE = process.env.OPENFINCH_API_URL || "http://localhost:8787";
const DEMO_SITE = process.env.DEMO_SITE_URL || "http://localhost:4173";
const LLM_PROVIDER = process.env.LLM_PROVIDER || "ollama";

async function main() {
  console.log("=== Extract Products Recipe ===\n");

  // 1. Fetch the products page first
  console.log("1. Fetching products page...");
  const fetchRes = await fetch(`${BASE}/v1/fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: `${DEMO_SITE}/products`,
      format: "markdown",
    }),
  });
  const fetchData = await fetchRes.json();
  if (fetchData.error) {
    console.error("Fetch error:", fetchData.error);
    process.exit(1);
  }
  console.log(`   Fetched ${fetchData.content.length} chars (${fetchData.tookMs}ms)`);

  // 2. Extract structured data
  console.log("\n2. Extracting product data with LLM...");
  const extractRes = await fetch(`${BASE}/v1/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: `${DEMO_SITE}/products`,
      prompt: "Extract all products with their name, price, category, rating, and stock status",
      schema: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "string" },
                category: { type: "string" },
                rating: { type: "string" },
                inStock: { type: "boolean" },
              },
            },
          },
        },
      },
      provider: LLM_PROVIDER,
    }),
  });
  const extractData = await extractRes.json();
  if (extractData.error) {
    console.error("Extract error:", extractData.error);
    process.exit(1);
  }

  console.log(`\n3. Extracted Data (${extractData.tookMs}ms):`);
  console.log(JSON.stringify(extractData.data, null, 2));

  // 4. Print summary
  const products = extractData.data?.products || [];
  if (Array.isArray(products) && products.length > 0) {
    console.log(`\nSummary: Extracted ${products.length} products`);
  }
}

main().catch(console.error);
