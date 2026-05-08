import { describe, it, expect, vi } from "vitest";

describe("JS SDK", () => {
  it("constructs correct request URLs", async () => {
    const mockFetch = vi.fn(async () => ({
      json: async () => ({ status: "ok" }),
      ok: true,
    }));
    vi.stubGlobal("fetch", mockFetch);

    const { OpenFinch } = await import("../index.js");
    const client = new OpenFinch({ baseUrl: "http://test:9999" });

    await client.health();
    expect(mockFetch).toHaveBeenCalledWith("http://test:9999/health", expect.any(Object));
  });

  it("uses default baseUrl when not provided", async () => {
    delete process.env.OPENFINCH_API_URL;
    const { OpenFinch } = await import("../index.js");
    const client = new OpenFinch();
    // Access private baseUrl via request pattern
    const mockFetch = vi.fn(async () => ({
      json: async () => ({ status: "ok" }),
      ok: true,
    }));
    vi.stubGlobal("fetch", mockFetch);
    await client.health();
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8787/health", expect.any(Object));
  });

  it("search sends correct body", async () => {
    const mockFetch = vi.fn(async () => ({
      json: async () => ({ results: [] }),
      ok: true,
    }));
    vi.stubGlobal("fetch", mockFetch);

    const { OpenFinch } = await import("../index.js");
    const client = new OpenFinch({ baseUrl: "http://test:9999" });

    await client.search({ query: "test query", limit: 5 });
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test:9999/v1/search",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ query: "test query", limit: 5 }),
      }),
    );
  });

  it("fetch sends correct body", async () => {
    const mockFetch = vi.fn(async () => ({
      json: async () => ({ content: "# Hello" }),
      ok: true,
    }));
    vi.stubGlobal("fetch", mockFetch);

    const { OpenFinch } = await import("../index.js");
    const client = new OpenFinch({ baseUrl: "http://test:9999" });

    await client.fetch({ url: "https://example.com", format: "markdown" });
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test:9999/v1/fetch",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ url: "https://example.com", format: "markdown" }),
      }),
    );
  });

  it("browser methods construct correct paths", async () => {
    const mockFetch = vi.fn(async () => ({
      json: async () => ({}),
      ok: true,
    }));
    vi.stubGlobal("fetch", mockFetch);

    const { OpenFinch } = await import("../index.js");
    const client = new OpenFinch({ baseUrl: "http://test:9999" });

    await client.browser.createSession();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test:9999/v1/browser/session",
      expect.any(Object),
    );

    await client.browser.screenshot("session-123");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test:9999/v1/browser/session/session-123/screenshot",
      expect.any(Object),
    );

    await client.browser.close("session-123");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test:9999/v1/browser/session/session-123",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("agent methods construct correct paths", async () => {
    const mockFetch = vi.fn(async () => ({
      json: async () => ({}),
      ok: true,
    }));
    vi.stubGlobal("fetch", mockFetch);

    const { OpenFinch } = await import("../index.js");
    const client = new OpenFinch({ baseUrl: "http://test:9999" });

    await client.agent.run({ goal: "test goal" });
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test:9999/v1/agent/run",
      expect.any(Object),
    );

    await client.agent.get("run-123");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test:9999/v1/agent/run/run-123",
      expect.any(Object),
    );

    await client.agent.result("run-123");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test:9999/v1/agent/run/run-123/result",
      expect.any(Object),
    );

    await client.agent.events("run-123");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test:9999/v1/agent/run/run-123/events",
      expect.any(Object),
    );
  });
});
