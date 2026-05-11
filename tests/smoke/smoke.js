#!/usr/bin/env node

/**
 * OpenFinch Smoke Tests (default)
 *
 * Runs local smoke tests (no Docker required).
 * For full Docker stack tests, use: pnpm smoke:docker
 *
 * Usage:
 *   pnpm smoke          — local tests only
 *   pnpm smoke:local    — local tests (same as above)
 *   pnpm smoke:docker   — full Docker stack tests
 *   pnpm smoke:dashboard — dashboard Playwright tests
 *
 * See docs/smoke-tests.md for details.
 */

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("\n========================================");
console.log("  OpenFinch Smoke Tests");
console.log("========================================");
console.log("\nRunning local smoke tests (no Docker required)...\n");

try {
  execSync("node tests/smoke/smoke-local.js", {
    cwd: resolve(__dirname, "../.."),
    stdio: "inherit",
    timeout: 30000,
  });
} catch {
  process.exit(1);
}
