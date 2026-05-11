# Installation

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 4 GB | 8 GB |
| CPU | 2 cores | 4+ cores |
| Disk | 2 GB | 10 GB |
| Docker | 20.10+ | latest |
| Docker Compose | 2.0+ | v2 |

## Option 1: One-Line Deploy

The fastest way to get running:

```bash
# Linux / macOS
curl -fsSL https://raw.githubusercontent.com/JonusNattapong/OpenFinch/main/deploy.sh | bash

# Windows (PowerShell as Admin)
irm https://raw.githubusercontent.com/JonusNattapong/OpenFinch/main/deploy.ps1 | iex
```

The deploy script checks prerequisites, clones the repo, creates `.env`, and starts services.

## Option 2: Manual Clone

```bash
git clone https://github.com/JonusNattapong/OpenFinch.git
cd OpenFinch
cp .env.example .env
```

### Configure Environment

Edit `.env` and set at least one LLM provider:

```bash
# Required: at least one LLM API key
OPENAI_API_KEY=sk-...          # OpenAI (recommended)
# ANTHROPIC_API_KEY=sk-...    # Anthropic
# GEMINI_API_KEY=...          # Google Gemini
# OPENROUTER_API_KEY=...     # OpenRouter
# OLLAMA_BASE_URL=http://localhost:11434  # Local Ollama
```

### Apply Database Migrations

```bash
docker compose up -d
docker compose exec api pnpm drizzle-kit migrate
```

## Option 3: Local Development

For contributing or extending OpenFinch:

```bash
git clone https://github.com/JonusNattapong/OpenFinch.git
cd OpenFinch
pnpm install
pnpm build

# Apply migrations
cd apps/api && pnpm drizzle-kit migrate && cd ../..

# Start infrastructure
docker compose up -d

# Run API in dev mode (with watch)
pnpm dev
```

## Ports

| Service | Default Port |
|---------|-------------|
| API Gateway | 8787 |
| Dashboard | 3000 |
| MCP Server | stdio |
| SearXNG | 8080 |
| Postgres | 5432 |
| Redis | 6379 |
| MinIO | 9000 |

## Next Steps

- [Deployment Guide](/guide/deployment) — Custom domains, TLS, environment options
- [CLI Setup](/guide/cli) — Install and configure the CLI
- [MCP Server](/guide/mcp) — Connect to Claude Desktop
