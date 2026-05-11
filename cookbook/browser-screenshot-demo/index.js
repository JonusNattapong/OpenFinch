#!/usr/bin/env node

/**
 * Browser Screenshot Demo Recipe
 *
 * Creates a browser session, navigates to a page, and captures a screenshot.
 *
 * Usage:
 *   export OPENFINCH_API_URL=http://localhost:8787
 *   node index.js
 *
 * Requires:
 *   - OpenFinch API running
 *   - Demo site running (pnpm demo:site)
 */

const BASE = process.env.OPENFINCH_API_URL || "http://localhost:8787";
const DEMO_SITE = process.env.DEMO_SITE_URL || "http://localhost:4173";
const OUTPUT_FILE = process.env.OUTPUT_FILE || "screenshot.png";

async function main() {
  console.log("=== Browser Screenshot Demo ===\n");

  // 1. Create browser session
  console.log("1. Creating browser session...");
  const createRes = await fetch(`${BASE}/v1/browser/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ headless: true }),
  });
  const createData = await createRes.json();
  if (createData.error) {
    console.error("Failed to create session:", createData.error);
    process.exit(1);
  }
  const sessionId = createData.sessionId;
  console.log(`   Session created: ${sessionId}`);

  // 2. Wait a moment for session to initialize
  await new Promise((r) => setTimeout(r, 1000));

  // 3. Navigate to demo site via a fetch (browser will auto-navigate on create)
  console.log(`\n2. Navigating to demo site products page...`);
  const fetchRes = await fetch(`${BASE}/v1/fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: `${DEMO_SITE}/products`,
      format: "markdown",
    }),
  });
  const fetchData = await fetchRes.json();
  console.log(`   Page fetched (${fetchData.tookMs}ms)`);

  // 4. Take screenshot
  console.log("\n3. Capturing screenshot...");
  const ssRes = await fetch(`${BASE}/v1/browser/session/${sessionId}/screenshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const ssData = await ssRes.json();
  if (ssData.error) {
    console.error("Screenshot failed:", ssData.error);
    process.exit(1);
  }

  // 5. Save screenshot
  const fs = await import("node:fs");
  const base64Data = ssData.screenshot.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(OUTPUT_FILE, Buffer.from(base64Data, "base64"));
  console.log(`   Screenshot saved to: ${OUTPUT_FILE}`);

  // 6. Close session
  console.log("\n4. Closing session...");
  await fetch(`${BASE}/v1/browser/session/${sessionId}`, { method: "DELETE" });
  console.log("   Session closed");

  console.log(`\nDone! Screenshot saved to ${OUTPUT_FILE}`);
}

main().catch(console.error);
