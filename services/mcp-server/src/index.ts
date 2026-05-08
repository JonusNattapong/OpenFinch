#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const API_URL = process.env.OPENFINCH_API_URL ?? "http://localhost:8787";

const server = new Server(
  { name: "openfinch-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "openfinch_search",
      description: "Search the web using SearXNG. Returns structured results with titles, URLs, and snippets.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          limit: { type: "number", default: 10, description: "Max results (1-50)" },
          language: { type: "string", description: "Language code (e.g., en, th, ja)" },
        },
        required: ["query"],
      },
    },
    {
      name: "openfinch_fetch",
      description: "Fetch a URL and return clean content as markdown, text, HTML, or JSON.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to fetch" },
          format: { type: "string", enum: ["markdown", "text", "html", "json"], default: "markdown" },
          timeoutMs: { type: "number", default: 15000, description: "Request timeout in ms" },
        },
        required: ["url"],
      },
    },
    {
      name: "openfinch_extract",
      description: "Extract structured JSON data from a webpage using an LLM.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to extract from" },
          prompt: { type: "string", description: "What to extract (e.g., 'Extract all product prices')" },
          schema: { type: "object", description: "Expected JSON schema (optional)" },
          provider: { type: "string", description: "LLM provider: openai, anthropic, gemini, ollama" },
        },
        required: ["url"],
      },
    },
    {
      name: "openfinch_browser_create_session",
      description: "Create a new browser session. Returns a session ID for subsequent operations.",
      inputSchema: {
        type: "object",
        properties: {
          headless: { type: "boolean", default: true },
          ttlSeconds: { type: "number", default: 300, description: "Session TTL" },
          viewport: {
            type: "object",
            properties: {
              width: { type: "number", default: 1280 },
              height: { type: "number", default: 720 },
            },
          },
        },
      },
    },
    {
      name: "openfinch_browser_screenshot",
      description: "Take a screenshot of an active browser session.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Session ID from create_session" },
        },
        required: ["sessionId"],
      },
    },
    {
      name: "openfinch_browser_close_session",
      description: "Close an active browser session.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Session ID to close" },
        },
        required: ["sessionId"],
      },
    },
    {
      name: "openfinch_agent_run",
      description: "Run an AI agent to perform a web-based task with browser automation.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Starting URL" },
          goal: { type: "string", description: "What the agent should accomplish" },
          maxSteps: { type: "number", default: 10, description: "Max automation steps" },
          provider: { type: "string", description: "LLM provider" },
        },
        required: ["goal"],
      },
    },
    {
      name: "openfinch_agent_get_result",
      description: "Get the result of a completed agent run.",
      inputSchema: {
        type: "object",
        properties: {
          runId: { type: "string", description: "Run ID from agent_run" },
        },
        required: ["runId"],
      },
    },
    {
      name: "openfinch_agent_get_events",
      description: "Get detailed events/traces of an agent run.",
      inputSchema: {
        type: "object",
        properties: {
          runId: { type: "string", description: "Run ID from agent_run" },
        },
        required: ["runId"],
      },
    },
  ],
}));

async function callApi(method: string, path: string, body?: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60000),
  });
  const data = (await res.json()) as Record<string, unknown>;
  return { status: res.status, data };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "openfinch_search": {
        const { query, limit, language } = args as { query: string; limit?: number; language?: string };
        const { data } = await callApi("POST", "/v1/search", { query, limit, language });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "openfinch_fetch": {
        const { url, format, timeoutMs } = args as {
          url: string; format?: string; timeoutMs?: number;
        };
        const { data } = await callApi("POST", "/v1/fetch", { url, format, timeoutMs });
        return {
          content: [{ type: "text", text: data.content ?? JSON.stringify(data) }],
        };
      }

      case "openfinch_extract": {
        const { url, prompt, schema, provider } = args as {
          url: string; prompt?: string; schema?: Record<string, unknown>; provider?: string;
        };
        const { data } = await callApi("POST", "/v1/extract", { url, prompt, schema, provider });
        return {
          content: [{ type: "text", text: JSON.stringify(data.data ?? data, null, 2) }],
        };
      }

      case "openfinch_browser_create_session": {
        const opts = args as Record<string, unknown> || {};
        const { data } = await callApi("POST", "/v1/browser/session", opts);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "openfinch_browser_screenshot": {
        const { sessionId } = args as { sessionId: string };
        const { data } = await callApi("POST", `/v1/browser/session/${sessionId}/screenshot`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "openfinch_browser_close_session": {
        const { sessionId } = args as { sessionId: string };
        const { data } = await callApi("DELETE", `/v1/browser/session/${sessionId}`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "openfinch_agent_run": {
        const { url, goal, maxSteps, provider } = args as {
          url?: string; goal: string; maxSteps?: number; provider?: string;
        };
        const { data } = await callApi("POST", "/v1/agent/run", {
          url, goal, maxSteps, provider,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "openfinch_agent_get_result": {
        const { runId } = args as { runId: string };
        const { data } = await callApi("GET", `/v1/agent/run/${runId}/result`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      case "openfinch_agent_get_events": {
        const { runId } = args as { runId: string };
        const { data } = await callApi("GET", `/v1/agent/run/${runId}/events`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[openfinch-mcp] Server started on stdio");
