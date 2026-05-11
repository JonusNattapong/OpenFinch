# Smoke Tests

Automated verification tests for OpenFinch core functionality.

## Test Files

| File | Purpose |
|------|---------|
| `tests/smoke/smoke.js` | Main E2E smoke test runner |
| `tests/smoke/mcp-smoke.mjs` | MCP server tool definition validation |
| `tests/smoke/verify-cookbook.js` | Cookbook recipe file completeness check |

## Running

```bash
# Run all smoke tests (requires Docker Compose + demo site)
pnpm smoke

# Run MCP smoke test only
node tests/smoke/mcp-smoke.mjs

# Verify cookbook recipes
pnpm verify:cookbook
pnpm verify:cookbook  # also via node
```

## Requirements

Smoke tests are designed to work without paid API keys:

- **Mandatory**: OpenFinch API running (`docker compose up -d`)
- **Optional**: Demo site (`pnpm demo:site`) for fetch/extract/browser tests
- **Optional**: Ollama for extract/agent LLM tests
- **Optional**: SearXNG for search tests

Tests skip gracefully with clear messages when dependencies are missing.

## Smoke Test Coverage

### API
- `GET /health` — returns `{"status":"ok"}`
- `GET /health/live` — returns `{"status":"alive"}`
- `GET /health/detail` — returns worker status
- `POST /v1/search` — returns results (or validates error)
- `POST /v1/search` — validates missing query returns 400
- `POST /v1/fetch` — returns markdown content from demo site
- `POST /v1/fetch` — validates missing URL returns 400
- `POST /v1/extract` — extracts products with Ollama
- `POST /v1/extract` — extracts with JSON schema
- `POST /v1/browser/session` — creates session
- `GET /v1/browser/session/:id` — returns session status
- `POST /v1/browser/session/:id/screenshot` — captures screenshot
- `DELETE /v1/browser/session/:id` — closes session
- `POST /v1/agent/run` — creates agent run
- `GET /v1/agent/providers` — lists providers

### CLI
- `--help` displays commands
- `health` returns API status

### MCP
- Server process starts without crashing
- Tool definitions match expected list (9 tools)

## Adding New Smoke Tests

1. Add a new `check()` call in `tests/smoke/smoke.js`
2. Follow the existing pattern:
   ```js
   await check("description of test", async () => {
     const { status, data } = await request("METHOD", `${BASE}/path`, body);
     if (status !== 200) throw new Error(`Expected 200, got ${status}`);
     // Assert on data fields
   });
   ```
3. For optional tests (require external service), use:
   ```js
   if (serviceAvailable) {
     await check(...);
   } else {
     await skip("test name", "reason for skip");
   }
   ```
