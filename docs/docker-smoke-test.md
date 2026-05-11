# Docker Smoke Test

Full-stack smoke tests that verify OpenFinch works end-to-end with Docker Compose.

## Requirements

- Docker & Docker Compose
- [Optional] Ollama running on host (for LLM extraction/agent tests)
- [Optional] Local demo site (auto-started by tests)

## Commands

```bash
# Start the stack
docker compose up -d

# Verify it's running
curl http://localhost:8787/health

# Run Docker smoke tests
pnpm smoke:docker

# Stop everything
pnpm docker:down
```

## What's Tested

| Test | What It Verifies | Depends On |
|------|-----------------|-----------|
| Health | `/health`, `/health/live`, `/health/ready`, `/health/detail` | API |
| Search | POST `/v1/search` returns results | SearXNG |
| Fetch | POST `/v1/fetch` returns markdown | Demo site |
| Extract | POST `/v1/extract` returns structured JSON | Demo site + Ollama |
| Browser | Create/screenshot/close session lifecycle | Browser worker |
| Agent | Create run + list providers | Ollama |
| CLI | `openfinch health` via Docker API | CLI built |
| MCP | Server starts without crashing | MCP server built |

## Expected Output

```
========================================
  OpenFinch Docker Smoke Tests
========================================

API: http://localhost:8787
Demo Site: http://localhost:4173

--- Prerequisites ---
  ✅ API is reachable
  ✅ Ollama available
  ✅ Demo site started

--- Health ---
  ✅ GET /health returns ok
  ✅ GET /health/live returns alive
  ✅ GET /health/ready returns ready
  ✅ GET /health/detail returns workers

--- Search ---
  ✅ POST /v1/search returns results
  ✅ POST /v1/search validates missing query

--- Fetch ---
  ✅ POST /v1/fetch returns markdown
  ...

========================================
  Summary: 15 passed, 0 failed, 3 skipped
========================================
```

## Common Failures

### API not reachable
```
❌ OpenFinch API is not reachable.
Run: docker compose up -d
```

**Fix:** Ensure Docker Compose is running and Postgres/Redis are healthy.

### SearXNG not ready
```
❌ POST /v1/search: Expected 200, got 502
```

**Fix:** SearXNG takes 10-30s to initialize on first start. Wait and retry.

### Ollama not available
```
⏭️ POST /v1/extract (skipped: Ollama not available)
```

**Fix:** Start Ollama: `ollama serve` and pull a model: `ollama pull llama3.2`

## Windows/WSL Notes

See [windows-validation.md](windows-validation.md) for detailed Windows guidance.

Key points:
- Use `curl.exe` not `curl` in PowerShell
- Docker Desktop must use WSL2 backend
- Clone to short path to avoid MAX_PATH issues

## Cleaning Up

```bash
# Stop all services
docker compose down

# Remove volumes (wipes Postgres, Redis, SearXNG, MinIO data)
docker compose down -v

# Remove all containers including profiles
docker compose --profile full down

# Prune unused Docker resources
docker system prune -f
```
