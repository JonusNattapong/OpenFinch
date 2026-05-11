#!/usr/bin/env node

/**
 * OpenFinch Local Smoke Tests
 *
 * Lightweight tests that do NOT require Docker Compose.
 * Tests: CLI, MCP, module imports, file structure.
 *
 * Usage: node tests/smoke/smoke-local.js
 *        pnpm smoke:local
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

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

async function main() {
  console.log("\n========================================");
  console.log("  OpenFinch Local Smoke Tests");
  console.log("  (no Docker required)");
  console.log("========================================\n");

  // === 1. File structure ===
  console.log("--- File Structure ---");
  const requiredDirs = [
    "apps/api/src",
    "apps/dashboard/src",
    "packages/sdk-js/src",
    "packages/schemas/src",
    "packages/shared/src",
    "packages/cli/src",
    "packages/sdk-python/src/openfinch",
    "services/search-worker/src",
    "services/fetch-worker/src",
    "services/browser-worker/src",
    "services/agent-worker/src",
    "services/mcp-server/src",
    "infra",
    "docs",
    "examples",
    "cookbook",
    "assets",
  ];
  for (const dir of requiredDirs) {
    await check(`Directory exists: ${dir}`, () => {
      const fullPath = path.join(ROOT, dir);
      if (!fs.existsSync(fullPath)) throw new Error(`Missing: ${dir}`);
      if (!fs.statSync(fullPath).isDirectory()) throw new Error(`Not a directory: ${dir}`);
    });
  }

  // === 2. Key files exist ===
  console.log("\n--- Key Files ---");
  const requiredFiles = [
    "package.json",
    "pnpm-workspace.yaml",
    "tsconfig.base.json",
    ".env.example",
    "infra/docker-compose.yml",
    "infra/Dockerfile.api",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "SECURITY.md",
  ];
  for (const file of requiredFiles) {
    await check(`File exists: ${file}`, () => {
      const fullPath = path.join(ROOT, file);
      if (!fs.existsSync(fullPath)) throw new Error(`Missing: ${file}`);
    });
  }

  // === 3. Package json consistency ===
  console.log("\n--- Package Consistency ---");
  const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
  await check("Root version is 0.1.0", () => {
    if (rootPkg.version !== "0.1.0") throw new Error(`Expected 0.1.0, got ${rootPkg.version}`);
  });
  await check("Root is private", () => {
    if (rootPkg.private !== true) throw new Error("Root should be private");
  });

  // Check workspace packages
  const workspaceDirs = [
    "apps/api", "apps/dashboard",
    "packages/sdk-js", "packages/cli", "packages/schemas", "packages/shared",
    "services/search-worker", "services/fetch-worker", "services/browser-worker",
    "services/agent-worker", "services/mcp-server",
  ];
  for (const dir of workspaceDirs) {
    await check(`Package: ${dir} has valid package.json`, () => {
      const pkgPath = path.join(ROOT, dir, "package.json");
      if (!fs.existsSync(pkgPath)) throw new Error(`Missing package.json in ${dir}`);
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (!pkg.name) throw new Error(`${dir}: missing name`);
      if (!pkg.version) throw new Error(`${dir}: missing version`);
      if (pkg.version !== "0.1.0") throw new Error(`${dir}: version mismatch ${pkg.version}`);
    });
  }

  // === 4. CLI smoke (build output) ===
  console.log("\n--- CLI ---");
  const cliDistPath = path.join(ROOT, "packages/cli/dist/cli.js");
  if (fs.existsSync(cliDistPath)) {
    await check("CLI --help produces output", () => {
      const out = execSync("node packages/cli/dist/cli.js --help", {
        cwd: ROOT, stdio: "pipe", timeout: 10000, encoding: "utf-8",
      });
      if (!out.includes("Usage") && !out.includes("Commands")) {
        throw new Error("CLI --help missing expected content");
      }
    });

    await check("CLI doctor module loads", async () => {
      const doctor = await import(pathToFileURL(path.join(ROOT, "packages/cli/dist/doctor.js")).href);
      if (typeof doctor.runDoctor !== "function") {
        throw new Error("doctor.runDoctor is not a function");
      }
    });
  } else {
    await skip("CLI --help produces output", "CLI not built (run: pnpm -F @openfinch/cli build)");
    await skip("CLI doctor module loads", "CLI not built");
  }

  // === 5. SDK module ===
  console.log("\n--- SDK ---");
  const sdkDistPath = path.join(ROOT, "packages/sdk-js/dist/index.js");
  if (fs.existsSync(sdkDistPath)) {
    await check("SDK JS module loads and exports OpenFinch", async () => {
      const mod = await import(pathToFileURL(path.join(ROOT, "packages/sdk-js/dist/index.js")).href);
      if (typeof mod.OpenFinch !== "function") {
        throw new Error("OpenFinch class not exported");
      }
    });
  } else {
    await skip("SDK JS module loads", "SDK not built (run: pnpm -F openfinch build)");
  }

  // === 6. MCP module ===
  console.log("\n--- MCP ---");
  const mcpDistPath = path.join(ROOT, "services/mcp-server/dist/index.js");
  if (fs.existsSync(mcpDistPath)) {
    await check("MCP server module loads", async () => {
      const mod = await import(pathToFileURL(path.join(ROOT, "services/mcp-server/dist/index.js")).href);
      // Just verify it loads without crashing
      if (!mod) throw new Error("MCP module returned empty");
    });
  } else {
    await skip("MCP server module loads", "MCP server not built (run: pnpm -F openfinch-mcp build)");
  }

  // === 7. Demo site ===
  console.log("\n--- Demo Site ---");
  await check("Demo site server.js exists", () => {
    const serverPath = path.join(ROOT, "examples/demo-site/server.js");
    if (!fs.existsSync(serverPath)) throw new Error("Missing examples/demo-site/server.js");
  });
  await check("Demo site public pages exist", () => {
    const pages = ["index.html", "products.html", "product-laptop.html", "docs.html", "form.html", "js-rendered.html"];
    for (const page of pages) {
      const pagePath = path.join(ROOT, "examples/demo-site/public", page);
      if (!fs.existsSync(pagePath)) throw new Error(`Missing public/${page}`);
    }
  });

  // === 8. Cookbook recipes ===
  console.log("\n--- Cookbook ---");
  const cookbookDirs = fs.existsSync(path.join(ROOT, "cookbook"))
    ? fs.readdirSync(path.join(ROOT, "cookbook")).filter(d => fs.statSync(path.join(ROOT, "cookbook", d)).isDirectory())
    : [];
  for (const dir of cookbookDirs) {
    await check(`Cookbook: ${dir} has README.md`, () => {
      if (!fs.existsSync(path.join(ROOT, "cookbook", dir, "README.md"))) {
        throw new Error(`Missing README.md in cookbook/${dir}`);
      }
    });
  }

  // === Summary ===
  console.log("\n========================================");
  console.log("  Local Smoke Test Results");
  console.log("========================================");
  console.log(`  Passed:  ${passed}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total:   ${passed + failed + skipped}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Local smoke test error:", err);
  process.exit(1);
});
