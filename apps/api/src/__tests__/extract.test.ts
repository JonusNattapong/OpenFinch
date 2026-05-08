import { describe, it, expect, vi } from "vitest";

// Mock fetch for extract tests
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock LLM provider
vi.mock("../lib/llm/registry.js", () => ({
  getProvider: vi.fn(() => ({
    name: "test-provider",
    call: vi.fn(async () => ({
      content: '{"name": "Test Product", "price": "$19.99"}',
      model: "test-model",
      provider: "test-provider",
    })),
  })),
  getAvailableProviders: vi.fn(() => ["test-provider"]),
}));

// Mock cache
vi.mock("../lib/cache.js", () => ({
  cacheGet: vi.fn(async () => null),
  cacheSet: vi.fn(async () => {}),
}));

describe("Extract API validation", () => {
  it("rejects missing url", async () => {
    const { extractRoute } = await import("../routes/extract.js");
    const { Hono } = await import("hono");
    const app = new Hono();
    app.route("/", extractRoute);

    const res = await app.request("/v1/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("rejects invalid url", async () => {
    const { extractRoute } = await import("../routes/extract.js");
    const { Hono } = await import("hono");
    const app = new Hono();
    app.route("/", extractRoute);

    const res = await app.request("/v1/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "not-a-url" }),
    });
    expect(res.status).toBe(400);
  });

  it("accepts valid request with url and prompt", async () => {
    // Mock fetch for page content
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => "<html><title>Test</title><body>Hello</body></html>",
      headers: new Map([["content-type", "text/html"]]),
    });

    const { extractRoute } = await import("../routes/extract.js");
    const { Hono } = await import("hono");
    const app = new Hono();
    app.route("/", extractRoute);

    const res = await app.request("/v1/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com", prompt: "Extract product info" }),
    });
    expect(res.status).toBe(200);
  });
});
