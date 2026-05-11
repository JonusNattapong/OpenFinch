import { getEffectiveApiUrl, getEffectiveDashboardUrl } from "./config.js";

const API_URL = getEffectiveApiUrl();
const DASHBOARD_URL = getEffectiveDashboardUrl();

interface CheckResult {
  name: string;
  status: "ok" | "warn" | "fail" | "skip";
  detail: string;
}

function ok(name: string, detail: string): CheckResult {
  return { name, status: "ok", detail };
}
function warn(name: string, detail: string): CheckResult {
  return { name, status: "warn", detail };
}
function fail(name: string, detail: string): CheckResult {
  return { name, status: "fail", detail };
}
function skip(name: string, detail: string): CheckResult {
  return { name, status: "skip", detail };
}

async function checkApi(): Promise<CheckResult> {
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      return ok("API", `Reachable at ${API_URL} (v${data.version ?? "?"}, uptime: ${Math.round((data.uptime as number) ?? 0)}s)`);
    }
    return fail("API", `Returned HTTP ${res.status}`);
  } catch (err) {
    return fail("API", `Cannot reach ${API_URL}: ${(err as Error).message}. Is Docker Compose running?`);
  }
}

async function checkDashboard(): Promise<CheckResult> {
  try {
    const res = await fetch(DASHBOARD_URL, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return ok("Dashboard", `Reachable at ${DASHBOARD_URL}`);
    return warn("Dashboard", `Returned HTTP ${res.status}`);
  } catch {
    return warn("Dashboard", `Cannot reach ${DASHBOARD_URL}. Dashboard may not be running (requires --profile full)`);
  }
}

async function checkSearXNG(): Promise<CheckResult> {
  try {
    const res = await fetch(`${API_URL}/health/ready`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      const checks = data.checks as Record<string, { status: string }>;
      if (checks?.searxng?.status === "ok") return ok("SearXNG", "Search engine is reachable");
      return fail("SearXNG", "Search engine is not ready");
    }
    return fail("SearXNG", "Health check failed");
  } catch {
    return fail("SearXNG", "Cannot reach SearXNG. Ensure searxng service is running.");
  }
}

async function checkRedis(): Promise<CheckResult> {
  try {
    const res = await fetch(`${API_URL}/health/ready`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      const checks = data.checks as Record<string, { status: string }>;
      if (checks?.redis?.status === "ok") return ok("Redis", "Cache is reachable");
      return fail("Redis", "Cache is not ready");
    }
    return fail("Redis", "Health check failed");
  } catch {
    return fail("Redis", "Cannot reach Redis. Ensure redis service is running.");
  }
}

async function checkPostgres(): Promise<CheckResult> {
  try {
    const res = await fetch(`${API_URL}/health/ready`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      const checks = data.checks as Record<string, { status: string }>;
      if (checks?.postgres?.status === "ok") return ok("Postgres", "Database is reachable");
      return fail("Postgres", "Database is not ready");
    }
    return fail("Postgres", "Health check failed");
  } catch {
    return fail("Postgres", "Cannot reach Postgres. Ensure postgres service is running.");
  }
}

async function checkBrowserSession(): Promise<CheckResult> {
  try {
    const res = await fetch(`${API_URL}/v1/browser/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headless: true, ttlSeconds: 30 }),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      const sessionId = data.sessionId as string;
      // Close it immediately
      await fetch(`${API_URL}/v1/browser/session/${sessionId}`, { method: "DELETE" });
      return ok("Browser sessions", "Session creation works");
    }

    if (res.status === 429) {
      return warn("Browser sessions", "Session limit reached (already at max).");
    }

    return fail("Browser sessions", `Session creation returned HTTP ${res.status}`);
  } catch {
    return fail("Browser sessions", "Cannot create browser session. Ensure browser-worker is running.");
  }
}

async function checkLLMProviders(): Promise<CheckResult> {
  try {
    const res = await fetch(`${API_URL}/v1/agent/providers`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = (await res.json()) as { providers: string[] };
      if (data.providers.length > 0) {
        return ok("LLM Providers", `Configured: ${data.providers.join(", ")}`);
      }
      return warn("LLM Providers", "No LLM providers configured. Set at least one API key or OLLAMA_BASE_URL.");
    }
    return fail("LLM Providers", "Provider endpoint returned HTTP ${res.status}");
  } catch {
    return fail("LLM Providers", "Cannot check providers. Ensure API is running.");
  }
}

async function checkDockerCompose(): Promise<CheckResult> {
  const isWindows = process.platform === "win32";
  const isWSL = process.platform === "linux" && (process.env.WSL_DISTRO_NAME !== undefined);

  try {
    const { execSync } = await import("child_process");
    const output = execSync("docker compose ps --services --filter status=running 2>/dev/null || docker-compose ps --services 2>/dev/null", {
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const services = output.trim().split("\n").filter(Boolean);
    if (services.length > 0) {
      return ok("Docker Compose", `${services.length} service(s) running: ${services.join(", ")}`);
    }
    return warn("Docker Compose", "Docker available but no services appear to be running. Try: docker compose up -d");
  } catch {
    return warn("Docker Compose", isWindows
      ? "Docker Compose not detected. Ensure Docker Desktop is running."
      : "Docker Compose not detected. Ensure Docker is installed.");
  }
}

async function checkWSL(): Promise<CheckResult | null> {
  if (process.platform !== "linux" || !process.env.WSL_DISTRO_NAME) {
    return null;
  }
  return warn("WSL", `Running in WSL (${process.env.WSL_DISTRO_NAME}). Ensure Docker Desktop WSL integration is enabled and use host.docker.internal for host services.`);
}

async function checkDockerDesktop(): Promise<CheckResult | null> {
  if (process.platform !== "win32") return null;
  try {
    const { execSync } = await import("child_process");
    execSync("docker info 2>/dev/null", { encoding: "utf-8", timeout: 5000, stdio: "ignore" });
    return ok("Docker Desktop", "Docker is running");
  } catch {
    return fail("Docker Desktop", "Docker is not running. Start Docker Desktop and try again.");
  }
}

export async function runDoctor(verbose = true): Promise<CheckResult[]> {
  console.log("OpenFinch System Diagnostics");
  console.log("===========================");
  console.log(`API URL: ${API_URL}`);
  console.log(`Dashboard URL: ${DASHBOARD_URL}`);
  console.log(`Platform: ${process.platform} ${process.arch}`);
  console.log(`Node.js: ${process.version}`);
  console.log();

  const checks: CheckResult[] = [];

  checks.push(await checkApi());

  // Only check deeper services if API is reachable
  if (checks[0].status === "ok") {
    const [dashboard, searxng, redis, postgres, browser, providers, dockerCompose] = await Promise.all([
      checkDashboard(),
      checkSearXNG(),
      checkRedis(),
      checkPostgres(),
      checkBrowserSession(),
      checkLLMProviders(),
      checkDockerCompose(),
    ]);

    checks.push(dashboard, searxng, redis, postgres, browser, providers, dockerCompose);

    // Platform-specific checks
    const wslCheck = await checkWSL();
    if (wslCheck) checks.push(wslCheck);

    const dockerDesktopCheck = await checkDockerDesktop();
    if (dockerDesktopCheck) checks.push(dockerDesktopCheck);
  }

  // Print results
  let passed = 0;
  let warnings = 0;
  let failed = 0;

  for (const check of checks) {
    const icon = check.status === "ok" ? "✓" : check.status === "warn" ? "!" : check.status === "fail" ? "✗" : "-";
    console.log(` ${icon} ${check.name}: ${check.detail}`);
    if (check.status === "ok") passed++;
    else if (check.status === "warn") warnings++;
    else if (check.status === "fail") failed++;
  }

  console.log();
  console.log(`Results: ${passed} passed, ${warnings} warnings, ${failed} failed`);

  if (failed > 0) {
    console.log();
    console.log("Common fixes:");
    console.log("  - Run 'docker compose up -d' in your OpenFinch directory");
    console.log("  - Set LLM API keys in .env file");
    console.log("  - On Windows: ensure Docker Desktop is running");
    console.log("  - On WSL: enable Docker Desktop WSL integration");
    console.log("  - See docs/troubleshooting.md for more help");
  }

  return checks;
}

// Allow running directly
const isMainModule = process.argv[1]?.endsWith("doctor.ts") || process.argv[1]?.endsWith("doctor.js");
if (isMainModule) {
  runDoctor().catch((err) => {
    console.error("Doctor check failed:", (err as Error).message);
    process.exit(1);
  });
}
