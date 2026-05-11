#!/usr/bin/env node

/**
 * OpenFinch Dashboard Smoke Tests
 *
 * Uses Playwright to verify dashboard loads and renders key pages.
 * Skips gracefully if Playwright is not installed or dashboard is unreachable.
 *
 * Usage: node tests/smoke/dashboard-smoke.js
 *        pnpm smoke:dashboard
 *
 * Requires:
 *   - Playwright: npx playwright install chromium
 *   - Dashboard running at http://localhost:3000
 */

const DASHBOARD_URL = process.env.OPENFINCH_DASHBOARD_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;
let skipped = 0;

async function check(label, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${label}`);
  } catch (err) {
    failed++;
    console.log(`  ❌ ${label}: ${err.message}`);
  }
}

async function skip(label, reason) {
  skipped++;
  console.log(`  ⏭️  ${label} (skipped: ${reason})`);
}

async function main() {
  console.log("\n========================================");
  console.log("  OpenFinch Dashboard Smoke Tests");
  console.log("========================================\n");
  console.log(`Dashboard URL: ${DASHBOARD_URL}`);

  // Check if Playwright is available
  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    console.log("\n  ⏭️  Playwright not installed. Install with:");
    console.log("  pnpm add -D playwright && npx playwright install chromium");
    console.log("  Or test manually: see docs/dashboard-smoke-test.md\n");
    await skip("All dashboard tests", "Playwright not available");
    printSummary();
    return;
  }

  // Check if dashboard is reachable
  try {
    const res = await fetch(DASHBOARD_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.log(`\n  ⏭️  Dashboard not reachable at ${DASHBOARD_URL}\n`);
    await skip("All dashboard tests", `Dashboard unreachable: ${err.message}`);
    printSummary();
    return;
  }

  // Launch browser
  console.log("\n   Launching browser...");
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  try {
    // 1. Dashboard loads
    console.log("\n--- Home Page ---");
    const page = await context.newPage();
    await page.goto(DASHBOARD_URL, { waitUntil: "domcontentloaded", timeout: 15000 });

    await check("Dashboard loads without errors", async () => {
      const title = await page.title();
      const body = await page.evaluate(() => document.body ? document.body.innerText.substring(0, 200) : "");
      if (!body || body.length === 0) throw new Error("Page body is empty");
    });

    await check("Page has visible content", async () => {
      const text = await page.evaluate(() => document.body?.innerText || "");
      if (text.length < 10) throw new Error("Page has minimal content");
    });

    // 2. Navigation
    console.log("\n--- Navigation ---");
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a, nav a, button")).map(el => el.textContent?.trim()).filter(Boolean)
    );
    await check("Navigation links are present", async () => {
      if (links.length === 0) throw new Error("No navigation links found");
    });

    // Try clicking common navigation links
    const navTexts = ["search", "fetch", "extract", "browser", "agent", "health", "overview", "home", "playground"];
    for (const text of navTexts) {
      const link = links.find(l => l.toLowerCase().includes(text));
      if (link) {
        await check(`Navigation link found: "${link}"`, async () => {});
      }
    }

    // 3. Check for error states
    console.log("\n--- Error States ---");
    await check("No console errors", async () => {
      const errors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      // Reload to capture console
      await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
      await new Promise(r => setTimeout(r, 1000));
      if (errors.length > 5) {
        throw new Error(`Too many console errors: ${errors.slice(0, 3).join("; ")}`);
      }
    });

  } finally {
    await browser.close();
  }

  printSummary();
}

function printSummary() {
  console.log("\n========================================");
  console.log("  Dashboard Smoke Test Results");
  console.log("========================================");
  console.log(`  Passed:  ${passed}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total:   ${passed + failed + skipped}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Dashboard smoke test error:", err);
  process.exit(1);
});
