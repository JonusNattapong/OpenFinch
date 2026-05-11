# Docker Guide

Docker Compose deployment reference.

## Quick Start

```bash
# Core services only
docker compose up -d

# All services including dashboard
docker compose --profile full up -d

# Verify
curl http://localhost:8787/health
```

## Service Management

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Stop + remove volumes (wipes all data)
docker compose down -v

# Restart
docker compose restart

# Restart specific service
docker compose restart api

# View logs
docker compose logs -f
docker compose logs -f api
docker compose logs --tail=100 searxng
```

## Validating Config

```bash
docker compose config    # Validate compose file
docker compose ps        # Show running services
docker compose images    # Show container images
docker compose top       # Show running processes
```

## Cleanup

```bash
# Stop all
docker compose down

# Remove volumes
docker compose down -v

# Remove all containers + profiles
docker compose --profile full down

# Prune unused Docker resources
docker system prune -f
```

## Profile Usage

| Profile | Services |
|---------|----------|
| (default) | api, postgres, redis, searxng, minio, search-worker, fetch-worker, browser-worker, agent-worker |
| `full` | All above + dashboard |

```bash
# Start with dashboard
docker compose --profile full up -d

# Stop dashboard only
docker compose stop dashboard
```

## Updating

```bash
git pull origin main
docker compose pull
docker compose up -d
```

## Environment Configuration

```bash
# Copy and edit
cp .env.example .env

# Apply changes
docker compose up -d

# View current env
docker compose exec api env | grep -E "^(OPEN|LLM|API)"
```
