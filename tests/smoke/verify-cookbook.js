#!/usr/bin/env node

/**
 * OpenFinch Cookbook Verifier
 *
 * Validates that cookbook recipes have the required files.
 * Optionally runs recipes that don't require external dependencies.
 *
 * Usage: node tests/smoke/verify-cookbook.js
 *        pnpm verify:cookbook
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const REQUIRED_FILES = ["README.md"];
const RUNNABLE_FILES = ["index.js", "index.ts", "run.sh"];

// Recipe requirements: what's needed to actually run
const RECIPES = {
  "basic-search": { requires: ["api"], skipWithout: "SearXNG or API running" },
  "fetch-docs": { requires: ["api", "demoSite"], skipWithout: "Demo site + API running" },
  "extract-products": { requires: ["api", "demoSite", "llm"], skipWithout: "Demo site + API + LLM provider" },
  "competitor-scout": { requires: ["api", "searxng", "llm"], skipWithout: "API + SearXNG + LLM provider" },
  "browser-screenshot-demo": { requires: ["api", "demoSite", "browser"], skipWithout: "API + Demo site + Browser worker" },
  "agent-form-demo": { requires: ["api", "demoSite", "llm", "browser"], skipWithout: "API + Demo site + LLM + Browser worker" },
};

function findCookbookDirs() {
  const cookbookDir = path.join(ROOT, "cookbook");
  const examplesDir = path.join(ROOT, "examples");
  const dirs = [];

  // Check cookbook/ directory
  if (fs.existsSync(cookbookDir)) {
    for (const entry of fs.readdirSync(cookbookDir)) {
      const fullPath = path.join(cookbookDir, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        dirs.push({ name: entry, path: fullPath, source: "cookbook" });
      }
    }
  }

  // Check examples/ directory
  if (fs.existsSync(examplesDir)) {
    for (const entry of fs.readdirSync(examplesDir)) {
      const fullPath = path.join(examplesDir, entry);
      if (fs.statSync(fullPath).isDirectory() && entry !== "demo-site") {
        dirs.push({ name: entry, path: fullPath, source: "examples" });
      }
    }
  }

  return dirs;
}

async function main() {
  console.log("\n========================================");
  console.log("  Cookbook Verifier");
  console.log("========================================\n");

  const dirs = findCookbookDirs();
  console.log(`Found ${dirs.length} recipe directories:\n`);

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const dir of dirs) {
    console.log(`  ${dir.name} (${dir.source}/)`);

    // Check README
    const readmePath = path.join(dir.path, "README.md");
    if (!fs.existsSync(readmePath)) {
      console.log(`    ❌ Missing README.md`);
      failed++;
      continue;
    }
    console.log(`    ✅ README.md`);

    // Check for runnable files
    const runnable = RUNNABLE_FILES.find(f => fs.existsSync(path.join(dir.path, f)));
    if (runnable) {
      console.log(`    ✅ ${runnable}`);
    }

    // Check .env.example (optional but recommended)
    if (fs.existsSync(path.join(dir.path, ".env.example"))) {
      console.log(`    ✅ .env.example`);
    }

    // Check recipe metadata
    const recipe = RECIPES[dir.name];
    if (recipe) {
      console.log(`    ℹ️  Requires: ${recipe.requires.join(", ")}`);
      if (recipe.requires.length > 2) {
        console.log(`    ⚠️  Complex recipe: ${recipe.requires.length} dependencies`);
        warnings++;
      }
    } else if (dir.name !== "mcp") {
      console.log(`    ℹ️  No metadata defined for this recipe`);
    }

    console.log();
    passed++;
  }

  // Summary
  console.log("========================================");
  console.log("  Verification Results");
  console.log("========================================");
  console.log(`  Checked:  ${dirs.length} recipes`);
  console.log(`  Passed:   ${passed}`);
  console.log(`  Missing:  ${failed}`);
  console.log(`  Warnings: ${warnings}`);

  if (failed > 0) {
    console.log("\n  Some recipes are missing required files.");
    process.exit(1);
  }

  console.log("\n  All recipes have required files. ✅\n");
}

main().catch((err) => {
  console.error("Verifier error:", err);
  process.exit(1);
});
