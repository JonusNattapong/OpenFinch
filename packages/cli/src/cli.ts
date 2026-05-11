#!/usr/bin/env node

import { loadConfig, saveConfig, getConfigValue, getEffectiveApiUrl, getEffectiveDashboardUrl } from "./config.js";
import { TEMPLATES, scaffoldTemplate } from "./templates.js";

const API_URL = getEffectiveApiUrl();
const DASHBOARD_URL = getEffectiveDashboardUrl();

async function request(method: string, path: string, body?: unknown): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

async function cmdHealth(): Promise<void> {
  const { status, data } = await request("GET", "/health");
  console.log(status === 200 ? "✓ API is healthy" : "✗ API is degraded");
  printJson(data);
}

async function cmdConfig(args: string[]): Promise<void> {
  const sub = args[0];
  const cfg = loadConfig();

  switch (sub) {
    case "list":
    case undefined: {
      console.log("OpenFinch CLI Configuration");
      console.log(`  Config file: ~/.config/openfinch/config.json`);
      console.log(`  API_URL:       ${cfg.apiUrl}  (env: OPENFINCH_API_URL)`);
      console.log(`  DASHBOARD_URL: ${cfg.dashboardUrl}  (env: OPENFINCH_DASHBOARD_URL)`);
      console.log(`  Provider:      ${cfg.provider ?? "(not set)"}`);
      console.log(`  Model:         ${cfg.model ?? "(not set)"}`);
      console.log(`  MaxSteps:      ${cfg.maxSteps ?? "(not set)"}`);
      break;
    }
    case "get": {
      const key = args[1];
      if (!key) {
        console.error("Usage: openfinch config get <key>");
        process.exit(1);
      }
      const val = getConfigValue(key as keyof typeof cfg);
      if (val === undefined) {
        console.error(`Unknown key: ${key}`);
        process.exit(1);
      }
      console.log(val);
      break;
    }
    case "set": {
      const key = args[1];
      const value = args[2];
      if (!key || value === undefined) {
        console.error("Usage: openfinch config set <key> <value>");
        process.exit(1);
      }
      const allowed = ["apiUrl", "dashboardUrl", "provider", "model", "maxSteps"] as const;
      if (!allowed.includes(key as typeof allowed[number])) {
        console.error(`Unknown key: ${key}. Allowed: ${allowed.join(", ")}`);
        process.exit(1);
      }
      const parsed = key === "maxSteps" ? parseInt(value, 10) : value;
      saveConfig({ [key]: parsed });
      console.log(`✓ ${key} set to ${parsed}`);
      break;
    }
    case "reset": {
      saveConfig({ apiUrl: "http://localhost:8787", dashboardUrl: "http://localhost:3000" });
      console.log("✓ Config reset to defaults");
      break;
    }
    default:
      console.error("Usage: openfinch config <list|get|set|reset>");
      process.exit(1);
  }
}

async function cmdSearch(args: string[]): Promise<void> {
  const query = args[0];
  if (!query) { console.error("Usage: openfinch search <query>"); process.exit(1); }
  const { data } = await request("POST", "/v1/search", { query, limit: 10 });
  printJson(data);
}

async function cmdFetch(args: string[]): Promise<void> {
  const url = args[0];
  if (!url) { console.error("Usage: openfinch fetch <url>"); process.exit(1); }
  const { data } = await request("POST", "/v1/fetch", { url });
  printJson(data);
}

async function cmdExtract(args: string[]): Promise<void> {
  const url = args[0];
  const prompt = args.slice(1).join(" ") || "Extract the main content";
  if (!url) { console.error("Usage: openfinch extract <url> [prompt]"); process.exit(1); }
  const { data } = await request("POST", "/v1/extract", { url, prompt });
  printJson(data);
}

async function cmdBrowserCreate(): Promise<void> {
  const { data } = await request("POST", "/v1/browser/session", {});
  console.log(`Session created: ${(data as Record<string, unknown>).sessionId}`);
  printJson(data);
}

async function cmdBrowserScreenshot(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) { console.error("Usage: openfinch browser screenshot <session-id>"); process.exit(1); }
  const { data } = await request("POST", `/v1/browser/session/${id}/screenshot`);
  printJson(data);
}

async function cmdBrowserClose(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) { console.error("Usage: openfinch browser close <session-id>"); process.exit(1); }
  const { data } = await request("DELETE", `/v1/browser/session/${id}`);
  printJson(data);
}

async function cmdAgentRun(args: string[]): Promise<void> {
  const goal = args.join(" ");
  if (!goal) { console.error("Usage: openfinch agent run <goal>"); process.exit(1); }
  const { data } = await request("POST", "/v1/agent/run", { goal });
  printJson(data);
}

async function cmdAgentGet(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) { console.error("Usage: openfinch agent get <run-id>"); process.exit(1); }
  const { data } = await request("GET", `/v1/agent/run/${id}`);
  printJson(data);
}

async function cmdAgentResult(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) { console.error("Usage: openfinch agent result <run-id>"); process.exit(1); }
  const { data } = await request("GET", `/v1/agent/run/${id}/result`);
  printJson(data);
}

async function cmdAgentEvents(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) { console.error("Usage: openfinch agent events <run-id>"); process.exit(1); }
  const { data } = await request("GET", `/v1/agent/run/${id}/events`);
  printJson(data);
}

async function cmdInit(args: string[]): Promise<void> {
  const templateFlag = args.indexOf("--template");
  if (templateFlag !== -1 && args[templateFlag + 1]) {
    const tmplName = args[templateFlag + 1];
    const targetDir = args[templateFlag + 2] ?? tmplName.replace(/\s+/g, "-").toLowerCase();
    scaffoldTemplate(tmplName, targetDir);
    return;
  }

  // List available templates
  console.log("Available project templates:");
  for (const [name, tmpl] of Object.entries(TEMPLATES)) {
    console.log(`  ${name.padEnd(20)} ${tmpl.description}`);
  }
  console.log();
  console.log("Usage:");
  console.log("  openfinch init                      Show this list");
  console.log("  openfinch init --template <name>    Scaffold a project");
  console.log("  openfinch init --template <name> <dir>  Scaffold into a specific directory");
  console.log();
  console.log("Getting started with Docker Compose:");
  console.log("  1. cp .env.example .env");
  console.log("  2. docker compose up -d");
  console.log("  3. curl http://localhost:8787/health");
  console.log();
  console.log("Docs: https://github.com/JonusNattapong/OpenFinch");
}

async function cmdDoctor(): Promise<void> {
  const { runDoctor } = await import("./doctor.js");
  await runDoctor();
}

async function main(): Promise<void> {
  const cmd = process.argv[2];
  const args = process.argv.slice(3);

  switch (cmd) {
    case "health":
      await cmdHealth();
      break;
    case "search":
      await cmdSearch(args);
      break;
    case "fetch":
      await cmdFetch(args);
      break;
    case "extract":
      await cmdExtract(args);
      break;
    case "browser":
      await handleBrowser(args);
      break;
    case "agent":
      await handleAgent(args);
      break;
    case "init":
      await cmdInit(args);
      break;
    case "doctor":
      await cmdDoctor();
      break;
    case "config":
      await cmdConfig(args);
      break;
    case "--help":
    case "help":
    default:
      showHelp();
      break;
  }
}

async function handleBrowser(args: string[]): Promise<void> {
  const sub = args[0];
  const subArgs = args.slice(1);
  switch (sub) {
    case "create": await cmdBrowserCreate(); break;
    case "screenshot": await cmdBrowserScreenshot(subArgs); break;
    case "close": await cmdBrowserClose(subArgs); break;
    default:
      console.error("Usage: openfinch browser <create|screenshot|close>");
      process.exit(1);
  }
}

async function handleAgent(args: string[]): Promise<void> {
  const sub = args[0];
  const subArgs = args.slice(1);
  switch (sub) {
    case "run": await cmdAgentRun(subArgs); break;
    case "get": await cmdAgentGet(subArgs); break;
    case "result": await cmdAgentResult(subArgs); break;
    case "events": await cmdAgentEvents(subArgs); break;
    default:
      console.error("Usage: openfinch agent <run|get|result|events>");
      process.exit(1);
  }
}

function showHelp(): void {
  console.log("OpenFinch CLI - Self-hosted AI web agent");
  console.log();
  console.log("Usage:");
  console.log("  openfinch health                  Check API health");
  console.log("  openfinch doctor                  Run system diagnostics");
  console.log("  openfinch search <query>          Search the web");
  console.log("  openfinch fetch <url>             Fetch a URL");
  console.log("  openfinch extract <url> [prompt] Extract structured data");
  console.log("  openfinch browser create         Create browser session");
  console.log("  openfinch browser screenshot <id>  Take screenshot");
  console.log("  openfinch browser close <id>     Close browser session");
  console.log("  openfinch agent run <goal>        Run an AI agent");
  console.log("  openfinch agent get <id>          Get agent status");
  console.log("  openfinch agent result <id>       Get agent result");
  console.log("  openfinch agent events <id>       Get agent trace events");
  console.log("  openfinch init                   List project templates");
  console.log("  openfinch init --template <name> Scaffold a project");
  console.log("  openfinch config list            Show current config");
  console.log("  openfinch config get <key>       Get a config value");
  console.log("  openfinch config set <key> <val> Set a config value");
  console.log("  openfinch config reset           Reset to defaults");
  console.log();
  console.log("Config keys: apiUrl, dashboardUrl, provider, model, maxSteps");
  console.log();
  console.log("Environment:");
  console.log("  OPENFINCH_API_URL    API endpoint (default: http://localhost:8787)");
  console.log("  OPENFINCH_DASHBOARD_URL  Dashboard URL (default: http://localhost:3000)");
}

main().catch((err) => {
  console.error("Error:", (err as Error).message);
  process.exit(1);
});
