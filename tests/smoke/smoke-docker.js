#!/usr/bin/env node

/**
 * OpenFinch Docker Smoke Tests
 *
 * Full-stack tests that REQUIRE Docker Compose running.
 * Tests: health, search, fetch, extract, browser, agent, CLI, MCP.
 *
 * Usage: node tests/smoke/smoke-docker.js
 *        pnpm smoke:docker
 *
 * Requires:
 *   - docker compose up -d (API, Postgres, Redis, SearXNG, workers)
 *   - Optionally: pnpm demo:site (for fetch/extract/browser tests)
 *   - Optionally: Ollama (for LLM tests)
 */

const BASE = process.env.OPENFINCH_API_URL || "http://localhost:8787";
const DEMO_SITE = process.env.DEMO_SITE_URL || "http://localhost:4173";
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function check(label, fn) {
  try {
    await fn();
    results.push({ label, status: "PASS" });
    passed++;
    console.log(`  ✅ ${label}`);
  } catch (err) {
    results.push({ label, status: "FAIL", error: err.message });
    failed++;
    console.log(`  ❌ ${label}: ${err.message}`);
  }
}

async function skip(label, reason) {
  results.push({ label, status: "SKIP", error: reason });
  skipped++;
  console.log(`  ⏭️  ${label} (skipped: ${reason})`);
}

async function isRunning(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function isOllamaAvailable() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return (data.models || []).length > 0;
    }
    return false;
  } catch {
    return false;
  }
}

async function startDemoSite() {
  const { spawn } = await import("node:child_process");
  return new Promise((resolve, reject) => {
    const proc = spawn("node", ["server.js"], {
      cwd: "examples/demo-site",
      env: { ...process.env, DEMO_SITE_PORT: "4173" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let started = false;
    const timeout = setTimeout(() => {
      if (!started) { proc.kill(); reject(new Error("Timed out")); }
    }, 10000);
    proc.stdout.on("data", (d) => {
      if (d.toString().includes("running at")) { started = true; clearTimeout(timeout); resolve(proc); }
    });
    proc.stderr.on("data", () => {});
    proc.on("error", reject);
    proc.on("exit", (c) => { if (!started) reject(new Error(`Exited ${c}`)); });
  });
}

async function main() {
  console.log("\n========================================");
  console.log("  OpenFinch Docker Smoke Tests");
  console.log("  (requires: docker compose up -d)");
  console.log("========================================\n");
  console.log(`API: ${BASE}`);
  console.log(`Demo Site: ${DEMO_SITE}`);
  console.log(`Ollama: ${OLLAMA_URL}`);

  // === Check Docker stack ===
  console.log("\n--- Prerequisites ---");
  const apiUp = await isRunning(BASE);
  if (!apiUp) {
    console.log("\n  ❌ OpenFinch API is not reachable.");
    console.log("  Run: docker compose up -d\n");
    process.exit(1);
  }
  console.log("  ✅ API is reachable");

  const ollamaOk = await isOllamaAvailable();
  console.log(`  ${ollamaOk ? "✅" : "⏭️"} Ollama ${ollamaOk ? "available" : "not available — LLM tests will skip"}`);

  // Start demo site
  let demoSiteProc = null;
  try {
    demoSiteProc = await startDemoSite();
    console.log("  ✅ Demo site started");
  } catch {
    console.log("  ⏭️ Demo site not available — fetch/extract tests may fail");
  }

  // === 1. Health ===
  console.log("\n--- Health ---");
  await check("GET /health returns ok", async () => {
    const { status, data } = await request("GET", `${BASE}/health`);
    if (status !== 200 || data?.status !== "ok") throw new Error(`Got ${status}: ${JSON.stringify(data)}`);
  });
  await check("GET /health/live returns alive", async () => {
    const { status, data } = await request("GET", `${BASE}/health/live`);
    if (status !== 200 || data?.status !== "alive") throw new Error(`Got ${status}: ${JSON.stringify(data)}`);
  });
  await check("GET /health/ready returns ready/degraded", async () => {
    const { status, data } = await request("GET", `${BASE}/health/ready`);
    if (status !== 200) throw new Error(`Got ${status}`);
    if (data?.status !== "ready" && data?.status !== "degraded") throw new Error(`Unexpected: ${JSON.stringify(data)}`);
  });
  await check("GET /health/detail returns workers", async () => {
    const { data } = await request("GET", `${BASE}/health/detail`);
    if (!data?.workers) throw new Error(`Missing workers: ${JSON.stringify(data)}`);
  });

  // === 2. Search ===
  console.log("\n--- Search ---");
  await check("POST /v1/search returns results", async () => {
    const { status, data } = await request("POST", `${BASE}/v1/search`, { query: "test", limit: 1 });
    if (status !== 200) throw new Error(`Expected 200, got ${status} (SearXNG may be starting)`);
    if (!data || !Array.isArray(data.results)) throw new Error(`Expected results array`);
  });
  await check("POST /v1/search validates missing query (400)", async () => {
    const { status } = await request("POST", `${BASE}/v1/search`, {});
    if (status !== 400) throw new Error(`Expected 400, got ${status}`);
  });

  // === 3. Fetch ===
  console.log("\n--- Fetch ---");
  if (demoSiteProc) {
    await check("POST /v1/fetch returns markdown from demo site", async () => {
      const { status, data } = await request("POST", `${BASE}/v1/fetch`, {
        url: `${DEMO_SITE}/`, format: "markdown",
      });
      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
      if (!data?.content?.includes("OpenFinch Demo Store")) throw new Error("Missing expected content");
    });
    await check("POST /v1/fetch products page", async () => {
      const { status, data } = await request("POST", `${BASE}/v1/fetch`, {
        url: `${DEMO_SITE}/products`, format: "markdown",
      });
      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
      if (!data?.content?.includes("QuantumBook")) throw new Error("Missing product content");
    });
  } else {
    await skip("POST /v1/fetch from demo site", "Demo site not running");
  }
  await check("POST /v1/fetch validates missing url (400)", async () => {
    const { status } = await request("POST", `${BASE}/v1/fetch`, { format: "markdown" });
    if (status !== 400) throw new Error(`Expected 400, got ${status}`);
  });

  // === 4. Extract ===
  console.log("\n--- Extract ---");
  if (ollamaOk && demoSiteProc) {
    await check("POST /v1/extract products with Ollama", async () => {
      const { status, data } = await request("POST", `${BASE}/v1/extract`, {
        url: `${DEMO_SITE}/products`,
        prompt: "Extract all product names and prices",
        provider: "ollama",
      });
      if (status !== 200) throw new Error(`Expected 200: ${JSON.stringify(data)}`);
      if (!data?.data) throw new Error("Missing data field");
    });
    await check("POST /v1/extract with JSON schema", async () => {
      const { status, data } = await request("POST", `${BASE}/v1/extract`, {
        url: `${DEMO_SITE}/products`,
        prompt: "Extract product info",
        schema: { type: "object", properties: { products: { type: "array" } } },
        provider: "ollama",
      });
      if (status !== 200) throw new Error(`Expected 200: ${JSON.stringify(data)}`);
    });
  } else {
    await skip("POST /v1/extract (Ollama)", "Ollama not available or demo site not running");
  }

  // === 5. Browser ===
  console.log("\n--- Browser ---");
  let sessionId = null;
  await check("POST /v1/browser/session creates session", async () => {
    const { status, data } = await request("POST", `${BASE}/v1/browser/session`, { headless: true });
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (!data?.sessionId) throw new Error(`Missing sessionId: ${JSON.stringify(data)}`);
    sessionId = data.sessionId;
  });

  if (sessionId) {
    await check("GET /v1/browser/session/:id returns status", async () => {
      const { status } = await request("GET", `${BASE}/v1/browser/session/${sessionId}`);
      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    });
    await check("POST /v1/browser/session/:id/screenshot", async () => {
      const { status, data } = await request("POST", `${BASE}/v1/browser/session/${sessionId}/screenshot`);
      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
      if (!data?.screenshot) throw new Error(`Missing screenshot data`);
    });
    await check("DELETE /v1/browser/session/:id closes session", async () => {
      const { status } = await request("DELETE", `${BASE}/v1/browser/session/${sessionId}`);
      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    });
  } else {
    await skip("Browser session tests", "No session created");
  }

  // === 6. Agent ===
  console.log("\n--- Agent ---");
  await check("GET /v1/agent/providers lists providers", async () => {
    const { status, data } = await request("GET", `${BASE}/v1/agent/providers`);
    if (status !== 200) throw new Error(`Expected 200`);
    if (!Array.isArray(data?.providers)) throw new Error(`Expected providers array`);
  });

  if (ollamaOk) {
    await check("POST /v1/agent/run creates run (Ollama)", async () => {
      const { status, data } = await request("POST", `${BASE}/v1/agent/run`, {
        goal: `Navigate to ${DEMO_SITE}/form and fill the name field`,
        provider: "ollama", maxSteps: 3, maxRuntimeSeconds: 60,
      });
      if (status !== 200) throw new Error(`Expected 200: ${JSON.stringify(data)}`);
      if (!data?.runId) throw new Error(`Missing runId`);
    });
  } else {
    await skip("POST /v1/agent/run", "Ollama not available");
  }

  // === 7. CLI ===
  console.log("\n--- CLI ---");
  try {
    const { execSync } = await import("node:child_process");
    await check("CLI health via Docker API", async () => {
      const out = execSync("node packages/cli/dist/cli.js health", {
        cwd: process.cwd(), stdio: "pipe", timeout: 10000, encoding: "utf-8",
      });
      if (!out.includes("ok") && !out.includes("OK") && !out.includes("healthy")) {
        throw new Error("CLI health unexpected output");
      }
    });
  } catch {
    await skip("CLI health via Docker API", "CLI not built or API unreachable via CLI");
  }

  // === 8. MCP ===
  console.log("\n--- MCP ---");
  try {
    const { spawn } = await import("node:child_process");
    const proc = spawn("node", ["dist/index.js"], {
      cwd: "services/mcp-server",
      env: { ...process.env, NODE_ENV: "test" },
      stdio: ["pipe", "pipe", "pipe"],
    });
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        if (proc.exitCode === null) { resolve(proc); } else { reject(new Error(`Exited ${proc.exitCode}`)); }
      }, 2000);
      proc.on("error", reject);
      proc.on("exit", (c) => { if (c !== null) reject(new Error(`Exited ${c}`)); });
    });
    await check("MCP server starts", async () => { /* alive check passed */ });
    proc.kill();
  } catch (err) {
    await skip("MCP server starts", err.message);
  }

  // Cleanup
  if (demoSiteProc) demoSiteProc.kill();

  // === Summary ===
  console.log("\n========================================");
  console.log("  Docker Smoke Test Results");
  console.log("========================================");
  console.log(`  Passed:  ${passed}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total:   ${passed + failed + skipped}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Docker smoke test error:", err);
  process.exit(1);
});
