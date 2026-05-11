# Getting Started

OpenFinch is a self-hosted AI web agent infrastructure. Run it on your own machine via Docker Compose.

## Prerequisites

- **Docker** & **Docker Compose** (v2+)
- **Node.js** 22+ (for CLI/SDK development)
- **pnpm** 10+ (package manager)
- **4GB+ RAM** (8GB+ recommended with browser automation)

## Quick Install

One-line deploy on any machine with Docker:

```bash
# Linux/macOS
curl -fsSL https://raw.githubusercontent.com/JonusNattapong/OpenFinch/main/deploy.sh | bash

# Windows (PowerShell as Admin)
irm https://raw.githubusercontent.com/JonusNattapong/OpenFinch/main/deploy.ps1 | iex
```

Or clone manually:

```bash
git clone https://github.com/JonusNattapong/OpenFinch.git
cd OpenFinch
cp .env.example .env
# Edit .env — set at least one LLM API key
docker compose up -d
```

## Verify Installation

```bash
curl http://localhost:8787/health
# {"status":"ok","version":"0.1.0","uptime":42,...}
```

## Try It Out

```bash
# Search the web
curl -X POST http://localhost:8787/v1/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "latest AI news", "limit": 5}'

# Fetch a page
curl -X POST http://localhost:8787/v1/fetch \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com"}'

# Run an agent
curl -X POST http://localhost:8787/v1/agent/run \
  -H 'Content-Type: application/json' \
  -d '{"goal": "Go to example.com and extract the main heading", "startUrl": "https://example.com"}'
```

## What's Next?

- [CLI Installation](/guide/cli) — Use the command-line tool
- [MCP Server](/guide/mcp) — Connect to Claude Desktop
- [SDK Setup](/guide/sdk) — Integrate into your application
- [Deployment Guide](/guide/deployment) — Docker Compose configuration
