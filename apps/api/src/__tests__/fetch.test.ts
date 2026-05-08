import { describe, it, expect } from "vitest";
import { FetchRequest, FetchResponse } from "@openfinch/schemas";

describe("Fetch API schema", () => {
  it("validates a basic fetch request", () => {
    const result = FetchRequest.safeParse({ url: "https://example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBe("https://example.com");
      expect(result.data.format).toBe("markdown");
      expect(result.data.renderJs).toBe("auto");
      expect(result.data.timeoutMs).toBe(15000);
    }
  });

  it("rejects invalid URL", () => {
    expect(FetchRequest.safeParse({ url: "not-a-url" }).success).toBe(false);
    expect(FetchRequest.safeParse({ url: "" }).success).toBe(false);
  });

  it("accepts all formats", () => {
    for (const fmt of ["markdown", "text", "html", "json"] as const) {
      expect(FetchRequest.safeParse({ url: "https://example.com", format: fmt }).success).toBe(true);
    }
  });

  it("rejects invalid format", () => {
    expect(FetchRequest.safeParse({ url: "https://example.com", format: "pdf" }).success).toBe(false);
  });

  it("accepts renderJs values", () => {
    expect(FetchRequest.safeParse({ url: "https://example.com", renderJs: true }).success).toBe(true);
    expect(FetchRequest.safeParse({ url: "https://example.com", renderJs: false }).success).toBe(true);
    expect(FetchRequest.safeParse({ url: "https://example.com", renderJs: "auto" }).success).toBe(true);
    expect(FetchRequest.safeParse({ url: "https://example.com", renderJs: "yes" }).success).toBe(false);
  });

  it("enforces timeout range", () => {
    expect(FetchRequest.safeParse({ url: "https://example.com", timeoutMs: 500 }).success).toBe(false);
    expect(FetchRequest.safeParse({ url: "https://example.com", timeoutMs: 70000 }).success).toBe(false);
    expect(FetchRequest.safeParse({ url: "https://example.com", timeoutMs: 30000 }).success).toBe(true);
  });

  it("produces valid fetch response shape", () => {
    const response = {
      url: "https://example.com",
      title: "Example",
      content: "# Hello",
      format: "markdown" as const,
      status: 200,
      rendered: false,
      cached: false,
      tookMs: 100,
      metadata: { contentType: "text/html", contentLength: 1234 },
    };
    const result = FetchResponse.safeParse(response);
    expect(result.success).toBe(true);
  });
});
