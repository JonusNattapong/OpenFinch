# Architecture

## Capability Escalation Model

OpenFinch follows a layered capability model. Always start with the lightest capability and escalate only when needed.

```
search → fetch → extract → agent → browser
(lightest)                         (heaviest)
```

| Capability | Use When |
|-----------|----------|
| **Search** | You need to find a URL first |
| **Fetch** | You have a URL and want content |
| **Extract** | You need structured data from a page |
| **Agent** | You need multi-step reasoning or navigation |
| **Browser** | You need screenshots or JavaScript rendering |

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User / Client                                          │
│  CLI  SDK  MCP  Dashboard                               │
└────────────────┬────────────────────────────────────────┘
                 │ REST
                 ▼
┌─────────────────────────────────────────────────────────┐
│  API Gateway  (Hono, port 8787)                         │
│  Routes: /health, /v1/search, /v1/fetch, /v1/extract   │
│          /v1/browser, /v1/agent                        │
└────────┬──────────┬────────────────────┬────────────────┘
         │          │                    │
         ▼          ▼                    ▼
┌────────────┐ ┌──────────┐        ┌──────────┐
│ BullMQ     │ │ Postgres │        │ Redis     │
│ (Queue)    │ │ (Store)  │        │ (Cache)   │
└────────────┘ └──────────┘        └──────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Workers (BullMQ consumers)                             │
│  search-worker  fetch-worker  browser-worker  agent-worker│
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  External Services                                       │
│  SearXNG (search)  Playwright (browser)  LLM Providers │
└─────────────────────────────────────────────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 8787 | REST API (Hono) |
| Dashboard | 3000 | Web UI (requires `--profile full`) |
| MCP Server | stdio | MCP protocol (stdio transport) |
| Postgres | 5432 | Persistent storage (Drizzle ORM) |
| Redis | 6379 | Queue + cache (BullMQ) |
| SearXNG | 8080 | Meta search engine |
| MinIO | 9000 | Artifact storage (S3-compatible) |
| Workers | — | BullMQ consumers |

## Data Flows

### Search

```
Client → API → SearXNG → normalize → cache (L3) → response
```

### Fetch

```
Client → API → HTTP fetch → markdown conversion → cache (L3) → response
         └──────────────────────────────→ Playwright (if JS rendering needed)
```

### Extract

```
Client → API → Fetch page → LLM extract → parse → cache (L3) → response
```

### Browser Session

```
Client → API → browser-worker → Playwright → session → screenshot → MinIO
```

### Agent

```
Client → API → Postgres (create run) → BullMQ (queue job)
  ↓
agent-worker → Playwright → observe → LLM decide → act → event trace
  ↓
Final result → Postgres → Client
```

## Caching

Three-tier cache for search, fetch, and extract:

1. **Memory** (L1) — fastest, process-local, lost on restart
2. **Redis** (L2) — shared across instances, lost on restart
3. **Postgres** (L3) — persistent, survives everything, slowest

On cache miss: L1 → L2 → L3 → null

On cache write: all three tiers simultaneously
