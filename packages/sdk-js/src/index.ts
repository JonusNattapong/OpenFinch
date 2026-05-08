export interface OpenFinchOptions {
  baseUrl?: string;
  apiKey?: string;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  language?: string;
}

export interface FetchOptions {
  url: string;
  format?: "markdown" | "text" | "html" | "json";
  timeoutMs?: number;
}

export interface ExtractOptions {
  url: string;
  prompt?: string;
  schema?: Record<string, unknown>;
  provider?: string;
  model?: string;
}

export interface AgentRunOptions {
  url?: string;
  goal: string;
  maxSteps?: number;
  provider?: string;
  model?: string;
}

export class OpenFinch {
  private baseUrl: string;
  private apiKey?: string;

  constructor(options: OpenFinchOptions = {}) {
    this.baseUrl = (options.baseUrl ?? process.env.OPENFINCH_API_URL ?? "http://localhost:8787").replace(/\/+$/, "");
    this.apiKey = options.apiKey;
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }

  async search(options: SearchOptions): Promise<unknown> {
    return this.request("POST", "/v1/search", options);
  }

  async fetch(options: FetchOptions): Promise<unknown> {
    return this.request("POST", "/v1/fetch", options);
  }

  async extract(options: ExtractOptions): Promise<unknown> {
    return this.request("POST", "/v1/extract", options);
  }

  async health(): Promise<unknown> {
    return this.request("GET", "/health");
  }

  browser = {
    createSession: (opts?: { headless?: boolean; ttlSeconds?: number; viewport?: { width: number; height: number } }) =>
      this.request("POST", "/v1/browser/session", opts ?? {}),
    screenshot: (sessionId: string) =>
      this.request("POST", `/v1/browser/session/${sessionId}/screenshot`),
    close: (sessionId: string) =>
      this.request("DELETE", `/v1/browser/session/${sessionId}`),
  };

  agent = {
    run: (options: AgentRunOptions) =>
      this.request("POST", "/v1/agent/run", options),
    get: (runId: string) =>
      this.request("GET", `/v1/agent/run/${runId}`),
    events: (runId: string) =>
      this.request("GET", `/v1/agent/run/${runId}/events`),
    result: (runId: string) =>
      this.request("GET", `/v1/agent/run/${runId}/result`),
  };
}

export default OpenFinch;
