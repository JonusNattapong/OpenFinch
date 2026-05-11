# Smoke Tests

Automated verification tests for OpenFinch core functionality.

## Running

```bash
# Local checks (no Docker required)
pnpm smoke:local

# Full stack with Docker
docker compose up -d
pnpm smoke:docker

# Verify cookbook recipes
pnpm verify:cookbook

# Dashboard smoke test (requires Playwright)
pnpm smoke:dashboard

# Cleanup
pnpm docker:down
```

## Test Coverage

### API

- `GET /health` — returns `{"status":"ok"}`
- `GET /health/live` — returns `{"status":"alive"}`
- `GET /health/detail` — returns worker status
- `POST /v1/search` — returns results
- `POST /v1/fetch` — returns markdown content
- `POST /v1/extract` — extracts structured JSON
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

- Server starts without crashing
- Tool definitions match expected list (9 tools)

## Requirements

- **Mandatory:** OpenFinch API running (`docker compose up -d`)
- **Optional:** Demo site (`pnpm demo:site`) for fetch/extract/browser tests
- **Optional:** Ollama for extract/agent LLM tests
- **Optional:** SearXNG for search tests

Tests skip gracefully with clear messages when dependencies are missing.
