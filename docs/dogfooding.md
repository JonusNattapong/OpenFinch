# Dogfooding Guide

How to validate OpenFinch works end-to-end by running it locally (dogfooding).

## Prerequisites

- Docker & Docker Compose
- Node.js 22+
- pnpm 10+
- Ollama (recommended for local LLM testing)

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/openfinch/openfinch.git
cd openfinch
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set at least one LLM provider key, or use Ollama

# 3. Start infrastructure
docker compose up -d

# 4. Verify API is running
curl http://localhost:8787/health

# 5. Run smoke tests
pnpm smoke
```

## Local Demo Site

The demo site provides safe, predictable pages for testing without external websites:

```bash
# Start the demo site
pnpm demo:site

# Test fetch
curl -X POST http://localhost:8787/v1/fetch \
  -H 'Content-Type: application/json' \
  -d '{"url":"http://localhost:4173/products","format":"markdown"}'

# Test extract (requires Ollama or other LLM)
curl -X POST http://localhost:8787/v1/extract \
  -H 'Content-Type: application/json' \
  -d '{"url":"http://localhost:4173/products","prompt":"Extract all product names","provider":"ollama"}'
```

## Smoke Tests

Automated smoke tests verify core functionality:

```bash
# Run all smoke tests (requires Docker Compose + demo site)
pnpm smoke

# Verify cookbook recipes have required files
pnpm verify:cookbook

# Run MCP smoke test
node tests/smoke/mcp-smoke.mjs
```

## What Smoke Tests Cover

| Test | What It Verifies | Requires |
|------|-----------------|----------|
| Health API | `/health`, `/health/live`, `/health/detail` return correct status | API running |
| Search | POST `/v1/search` returns results | SearXNG |
| Fetch | POST `/v1/fetch` returns markdown content | Demo site |
| Extract | POST `/v1/extract` returns structured JSON | Demo site + LLM |
| Browser | Create/screenshot/close session lifecycle | Browser worker |
| Agent | Create run, poll status, get providers | LLM provider |
| CLI | `openfinch health` and `--help` commands | CLI built |
| MCP | Server starts and exposes tool definitions | MCP server built |

## Manual Testing Flow

### 1. API Health

```bash
curl http://localhost:8787/health
curl http://localhost:8787/health/live
curl http://localhost:8787/health/ready
curl http://localhost:8787/health/detail
```

### 2. Fetch

```bash
pnpm demo:site &

curl -X POST http://localhost:8787/v1/fetch \
  -H 'Content-Type: application/json' \
  -d '{"url":"http://localhost:4173/","format":"markdown"}'
```

### 3. Extract

```bash
curl -X POST http://localhost:8787/v1/extract \
  -H 'Content-Type: application/json' \
  -d '{"url":"http://localhost:4173/products","prompt":"Extract all product names and prices","provider":"ollama"}'
```

### 4. Browser

```bash
# Create session
curl -X POST http://localhost:8787/v1/browser/session \
  -H 'Content-Type: application/json' \
  -d '{"headless":true}'

# Take screenshot (use sessionId from response)
curl -X POST http://localhost:8787/v1/browser/session/<sessionId>/screenshot

# Close session
curl -X DELETE http://localhost:8787/v1/browser/session/<sessionId>
```

### 5. Agent

```bash
curl -X POST http://localhost:8787/v1/agent/run \
  -H 'Content-Type: application/json' \
  -d '{"goal":"Navigate to http://localhost:4173/form","provider":"ollama","maxSteps":3,"maxRuntimeSeconds":60}'
```

### 6. CLI

```bash
node packages/cli/dist/cli.js health
node packages/cli/dist/cli.js doctor
node packages/cli/dist/cli.js fetch http://localhost:4173/ --format markdown
```

## Verification Checklist

- [ ] `pnpm install --frozen-lockfile` — dependencies install
- [ ] `pnpm -r build` — all packages compile
- [ ] `pnpm -r test` — unit tests pass
- [ ] `pnpm typecheck` — no type errors
- [ ] `docker compose config` — compose file validates
- [ ] `docker compose up -d` — all services start
- [ ] Health endpoints return correct status
- [ ] Fetch returns content from demo site
- [ ] Extract returns data with Ollama
- [ ] Browser session lifecycle works
- [ ] CLI commands produce meaningful output
- [ ] Cookbook recipes have required files
- [ ] MCP server starts without crashing

## Known Gaps

- **Browser tests** require Chromium/Playwright in the browser-worker container
- **Agent tests** require an LLM provider (Ollama recommended)
- **Search tests** require SearXNG to be fully initialized
- **MCP smoke test** uses process-based verification (HTTP/SSE transport not tested)
- **Dashboard** requires manual testing (see docs/dashboard-smoke-test.md)
