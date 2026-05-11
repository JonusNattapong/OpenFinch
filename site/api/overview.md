# API Overview

The OpenFinch REST API is built with Hono and runs on port **8787** by default.

## Base URL

```
http://localhost:8787
```

## Authentication

No authentication required by default. For production, configure your own auth middleware or use a reverse proxy (nginx, Cloudflare, etc.) with your auth provider.

## Request Format

All `POST` endpoints accept JSON:

```bash
curl -X POST http://localhost:8787/v1/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "..."}'
```

## Response Format

All responses are JSON.

Success:
```json
{
  "results": [...],
  "cached": false
}
```

Error:
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Basic health check |
| `GET` | `/health/live` | Liveness probe |
| `GET` | `/health/ready` | Readiness (checks dependencies) |
| `GET` | `/health/detail` | Detailed health status |
| `POST` | `/v1/search` | Web search |
| `POST` | `/v1/fetch` | Fetch URL content |
| `POST` | `/v1/extract` | Extract structured data |
| `POST` | `/v1/browser/session` | Create browser session |
| `GET` | `/v1/browser/session/:id` | Get session status |
| `POST` | `/v1/browser/session/:id/screenshot` | Take screenshot |
| `DELETE` | `/v1/browser/session/:id` | Close session |
| `POST` | `/v1/agent/run` | Create agent run |
| `GET` | `/v1/agent/run/:id` | Get run status |
| `GET` | `/v1/agent/run/:id/result` | Get run result |
| `GET` | `/v1/agent/run/:id/events` | Get event trace |
| `POST` | `/v1/agent/run/:id/cancel` | Cancel a run |
| `GET` | `/v1/agent/providers` | List available providers |

## Rate Limiting

Domain-level rate limiting: **30 requests per 60 seconds** per domain (configurable via `RATE_LIMIT_PER_DOMAIN` and `RATE_LIMIT_WINDOW`).

## Caching

Search, fetch, and extract responses are cached:
- Search: 10 minutes (600s)
- Fetch: 1 hour (3600s)
- Extract: 1 hour (3600s)

Cache is three-tier: Memory → Redis → Postgres (durable fallback).

## Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request body or parameters |
| 403 | `ROBOTS_TXT_BLOCKED` | URL blocked by robots.txt |
| 429 | `RATE_LIMITED` | Domain rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Server error |
| 502 | `FETCH_ERROR` | Target site unreachable |
| 503 | `SERVICE_UNAVAILABLE` | Required service not available |
