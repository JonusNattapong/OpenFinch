import { describe, it, expect } from "vitest";
import { SearchRequest, SearchResponse } from "@openfinch/schemas";

describe("Search API schema", () => {
  it("validates a basic search request", () => {
    const result = SearchRequest.safeParse({ query: "hello world" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("hello world");
      expect(result.data.limit).toBe(10);
    }
  });

  it("rejects empty query", () => {
    const result = SearchRequest.safeParse({ query: "" });
    expect(result.success).toBe(false);
  });

  it("rejects query over 500 chars", () => {
    const result = SearchRequest.safeParse({ query: "a".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("accepts language and region", () => {
    const result = SearchRequest.safeParse({ query: "test", language: "en", region: "us" });
    expect(result.success).toBe(true);
  });

  it("enforces limit range", () => {
    expect(SearchRequest.safeParse({ query: "x", limit: 0 }).success).toBe(false);
    expect(SearchRequest.safeParse({ query: "x", limit: 51 }).success).toBe(false);
    expect(SearchRequest.safeParse({ query: "x", limit: 25 }).success).toBe(true);
  });

  it("produces valid search response shape", () => {
    const response = {
      query: "test",
      results: [
        { title: "T", url: "https://example.com", snippet: "S", source: "web", rank: 1 },
      ],
      cached: false,
      tookMs: 42,
    };
    const result = SearchResponse.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("requires rank field in results", () => {
    const response = {
      query: "test",
      results: [{ title: "T", url: "https://example.com", snippet: "S", source: null }],
      cached: false,
      tookMs: 42,
    };
    const result = SearchResponse.safeParse(response);
    expect(result.success).toBe(false);
  });
});
