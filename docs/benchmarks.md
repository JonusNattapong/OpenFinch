# Benchmarks

Local performance benchmarks for OpenFinch API endpoints.

## Prerequisites

- OpenFinch running: `docker compose up -d`
- [Optional] Demo site: `pnpm demo:site`
- [Optional] Ollama running for extract benchmarks

## Running

```bash
pnpm bench
```

Skips unavailable services gracefully.

## What's Measured

| Endpoint | What It Tests | Expected Range (localhost) |
|----------|--------------|---------------------------|
| `GET /health` | Basic health check | <10ms |
| `GET /health/live` | Liveness probe | <10ms |
| `GET /health/ready` | Readiness (Redis, Postgres, etc.) | 10-100ms |
| `GET /health/detail` | Detailed health with workers | 10-100ms |
| `POST /v1/fetch` | Fetch markdown from demo site | 50-500ms |
| `POST /v1/extract` | LLM extraction (Ollama) | 2-15s |
| `POST /v1/browser/session` | Create Playwright session | 1-5s |

## Interpreting Results

All benchmarks run against localhost. Numbers depend heavily on:

- **Machine specs** — CPU, RAM, SSD speed
- **Ollama model size** — Larger models = slower extraction
- **SearXNG cache** — Cached searches return faster
- **Browser state** — First browser session is slower (Chromium startup)

Benchmarks use p50 (median) and p95 (95th percentile) metrics:

```
Test                              Avg      p50      p95
---------------------------------------------------------------------
GET /health                       3ms      2ms      5ms
GET /health/live                  2ms      2ms      4ms
GET /health/ready                 45ms     42ms     89ms
POST /v1/fetch (markdown)         120ms    115ms    180ms
POST /v1/extract (Ollama)         4500ms   4200ms   5100ms
POST /v1/browser/session          2500ms   2500ms   2500ms
```

## Notes

- Benchmarks are **local-only** — not representative of production latency.
- Extract benchmarks with Ollama depend on model and hardware.
- Browser session creation is measured once (expensive operation).
- For consistent results, run when the system is otherwise idle.
