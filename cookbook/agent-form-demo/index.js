#!/usr/bin/env node

/**
 * Agent Form Demo Recipe
 *
 * Demonstrates an autonomous agent that interacts with a form page.
 *
 * Usage:
 *   export OPENFINCH_API_URL=http://localhost:8787
 *   node index.js
 *
 * Requires:
 *   - OpenFinch API running
 *   - Demo site running (pnpm demo:site)
 *   - Ollama or another LLM provider
 *   - Browser worker running (part of Docker Compose)
 */

const BASE = process.env.OPENFINCH_API_URL || "http://localhost:8787";
const DEMO_SITE = process.env.DEMO_SITE_URL || "http://localhost:4173";
const LLM_PROVIDER = process.env.LLM_PROVIDER || "ollama";

async function main() {
  console.log("=== Agent Form Demo ===\n");
  console.log(`Goal: Navigate to ${DEMO_SITE}/form and fill out the contact form`);
  console.log(`Provider: ${LLM_PROVIDER}\n`);

  // Create agent run
  console.log("Creating agent run...");
  const runRes = await fetch(`${BASE}/v1/agent/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      goal: `Navigate to ${DEMO_SITE}/form and fill in the name field with "OpenFinch Agent", email field with "agent@openfinch.dev", subject with "Test", and message with "This is an automated test."`,
      provider: LLM_PROVIDER,
      maxSteps: 10,
      maxRuntimeSeconds: 120,
    }),
  });
  const runData = await runRes.json();
  if (runData.error) {
    console.error("Failed to create agent run:", runData.error);
    process.exit(1);
  }

  const runId = runData.runId;
  console.log(`Run created: ${runId}`);
  console.log(`Status: ${runData.status}`);

  // Poll for completion
  console.log("\nPolling for results (max 60s)...");
  const startTime = Date.now();
  const timeout = 60000;

  while (Date.now() - startTime < timeout) {
    await new Promise((r) => setTimeout(r, 2000));

    const statusRes = await fetch(`${BASE}/v1/agent/run/${runId}`);
    const statusData = await statusRes.json();

    if (statusData.error) {
      console.log(`Status error: ${statusData.error}`);
      break;
    }

    process.stdout.write(`\r   Status: ${statusData.status} (step ${statusData.currentStep || 0}/${statusData.totalSteps || "?"})`);

    if (statusData.status === "succeeded" || statusData.status === "failed") {
      console.log("\n");

      // Get result
      const resultRes = await fetch(`${BASE}/v1/agent/run/${runId}/result`);
      const resultData = await resultRes.json();
      console.log(`Final status: ${resultData.status}`);
      if (resultData.result) {
        console.log("Result:", JSON.stringify(resultData.result, null, 2));
      }
      if (resultData.error) {
        console.log("Error:", resultData.error);
      }

      // Get events
      const eventsRes = await fetch(`${BASE}/v1/agent/run/${runId}/events`);
      const eventsData = await eventsRes.json();
      if (Array.isArray(eventsData)) {
        console.log(`\nAgent trace (${eventsData.length} events):`);
        for (const evt of eventsData.slice(-5)) {
          console.log(`  [${evt.type}] step ${evt.step}`);
        }
      }
      break;
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
