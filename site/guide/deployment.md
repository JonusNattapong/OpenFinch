# Deployment

## Docker Compose

The default deployment uses Docker Compose:

```bash
docker compose up -d
```

### Start Services

```bash
# Core services only (API + workers)
docker compose up -d

# All services including dashboard
docker compose --profile full up -d
```

### Stop & Restart

```bash
docker compose down          # Stop
docker compose down -v       # Stop + remove volumes
docker compose restart       # Restart
docker compose restart api   # Restart specific service
```

### View Logs

```bash
docker compose logs -f       # All services
docker compose logs -f api   # Specific service
```

## Environment Variables

### Core

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | — | Anthropic API key |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `OPENROUTER_API_KEY` | — | OpenRouter API key |
| `OLLAMA_BASE_URL` | — | Ollama base URL |
| `DATABASE_URL` | postgres://... | Postgres connection string |
| `REDIS_URL` | redis://... | Redis connection string |
| `API_PORT` | 8787 | API HTTP port |
| `LOG_LEVEL` | info | Log level (debug, info, warn, error) |

### Workers

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_BROWSER_SESSIONS` | 2 | Max concurrent browser sessions |
| `BROWSER_SESSION_TTL` | 300 | Browser session TTL in seconds |
| `AGENT_MAX_STEPS` | 20 | Max steps per agent run |
| `AGENT_MAX_RUNTIME` | 180 | Max agent runtime in seconds |
| `RATE_LIMIT_PER_DOMAIN` | 30 | Requests per window per domain |
| `RATE_LIMIT_WINDOW` | 60 | Rate limit window in seconds |

### Safety

| Variable | Default | Description |
|----------|---------|-------------|
| `RESPECT_ROBOTS_TXT` | true | Respect robots.txt |
| `USER_AGENT` | OpenFinch/0.1.0 | Custom user agent |
| `ALLOWED_DOMAINS` | [] | Restrict to specific domains |

## One-Line Deploy

For production, use the deploy script with environment variables:

```bash
OPENAI_API_KEY=sk-... docker compose up -d
```

Or use the deploy helper:

```bash
OPENAI_API_KEY=sk-... bash <(curl -fsSL https://raw.githubusercontent.com/JonusNattapong/OpenFinch/main/deploy.sh)
```

## Health Checks

```bash
# Basic health
curl http://localhost:8787/health

# Liveness probe
curl http://localhost:8787/health/live

# Readiness (checks all dependencies)
curl http://localhost:8787/health/ready

# Detailed status
curl http://localhost:8787/health/detail
```

## Updating

```bash
cd openfinch
git pull origin main
docker compose pull
docker compose up -d
```

## Troubleshooting

See the [Troubleshooting](/reference/troubleshooting) reference for common deployment issues.
