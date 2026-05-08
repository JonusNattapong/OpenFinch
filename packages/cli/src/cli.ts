#!/usr/bin/env node

const API_URL = process.env.OPENFINCH_API_URL ?? "http://localhost:8787";
const DASHBOARD_URL = process.env.OPENFINCH_DASHBOARD_URL ?? "http://localhost:3000";

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

async function cmdInit(): Promise<void> {
  console.log("To get started with OpenFinch:");
  console.log();
  console.log("  1. Copy and edit the environment file:");
  console.log("     cp .env.example .env");
  console.log("     # Set your LLM API keys in .env");
  console.log();
  console.log("  2. Start with Docker Compose:");
  console.log("     docker compose up -d");
  console.log();
  console.log("  3. Check health:");
  console.log("     curl http://localhost:8787/health");
  console.log();
  console.log("  4. Try a search:");
  console.log("     openfinch search 'latest AI news'");
  console.log();
  console.log("  Full docs: https://github.com/openfinch/openfinch");
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
      await cmdInit();
      break;
    case "doctor":
      await cmdDoctor();
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
  console.log("  openfinch health              Check API health");
  console.log("  openfinch doctor              Run system diagnostics");
  console.log("  openfinch search <query>      Search the web");
  console.log("  openfinch fetch <url>         Fetch a URL");
  console.log("  openfinch extract <url> [prompt]  Extract structured data");
  console.log("  openfinch browser create      Create browser session");
  console.log("  openfinch browser screenshot <id>  Take screenshot");
  console.log("  openfinch browser close <id>  Close browser session");
  console.log("  openfinch agent run <goal>    Run an AI agent");
  console.log("  openfinch agent get <id>      Get agent status");
  console.log("  openfinch agent result <id>   Get agent result");
  console.log("  openfinch agent events <id>   Get agent trace events");
  console.log("  openfinch init                Show getting started guide");
  console.log();
  console.log("Environment:");
  console.log("  OPENFINCH_API_URL   API endpoint (default: http://localhost:8787)");
}

main().catch((err) => {
  console.error("Error:", (err as Error).message);
  process.exit(1);
});
