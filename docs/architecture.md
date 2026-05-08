# Architecture

OpenFinch follows a layered capability model:

```
search → fetch → extract → agent → browser
(lightest)                         (heaviest)
```

## Service Architecture

```
User/Client → API Gateway (:8787) → BullMQ → Workers
                                      │
                            Postgres + Redis + MinIO
                                      
MCP Server (:8788) → same API endpoints
Dashboard (:3000)   → proxied API calls
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| API | 8787 | REST API gateway (Hono) |
| MCP Server | 8788 | MCP protocol server (stdio) |
| Dashboard | 3000 | Web UI (Hono-served) |
| Postgres | 5432 | Persistent storage (Drizzle ORM) |
| Redis | 6379 | Queue + cache (BullMQ) |
| SearXNG | 8080 | Meta search engine |
| MinIO | 9000 | Artifact storage (screenshots) |
| Workers | — | BullMQ consumers |

## Data Flow

1. **Search**: Client → API → SearXNG → normalize → cache → response
2. **Fetch**: Client → API → HTTP fetch → markdown → cache → response
3. **Extract**: Client → API → fetch page → LLM extract → parse → cache → response
4. **Browser**: Client → API → browser worker (Playwright) → session → screenshot
5. **Agent**: Client → API → queue → agent worker → browser loop → traces → result
