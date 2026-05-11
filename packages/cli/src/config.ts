import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface CliConfig {
  apiUrl: string;
  dashboardUrl: string;
  provider?: string;
  model?: string;
  maxSteps?: number;
}

const DEFAULT_CONFIG: CliConfig = {
  apiUrl: "http://localhost:8787",
  dashboardUrl: "http://localhost:3000",
};

const CONFIG_DIR = join(homedir(), ".config", "openfinch");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

function ensureDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): CliConfig {
  ensureDir();
  if (!existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(partial: Partial<CliConfig>): CliConfig {
  ensureDir();
  const current = loadConfig();
  const updated = { ...current, ...partial };
  writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2) + "\n");
  return updated;
}

export function getConfigValue(key: keyof CliConfig): string | undefined {
  const cfg = loadConfig();
  return cfg[key] as string | undefined;
}

export function getEffectiveApiUrl(): string {
  // Env var takes priority
  if (process.env.OPENFINCH_API_URL) return process.env.OPENFINCH_API_URL;
  const cfg = loadConfig();
  return cfg.apiUrl;
}

export function getEffectiveDashboardUrl(): string {
  if (process.env.OPENFINCH_DASHBOARD_URL) return process.env.OPENFINCH_DASHBOARD_URL;
  const cfg = loadConfig();
  return cfg.dashboardUrl;
}
