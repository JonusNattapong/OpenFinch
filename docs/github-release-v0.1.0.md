# OpenFinch v0.1.0 — GitHub Release

## Release Title

**v0.1.0 — Open-source self-hosted AI web agent infrastructure**

## Short Description

Search, fetch, extract, browse, and run AI web agents from your own machine. Bring your own model. Own your data. No platform fee.

## Highlights

- **Self-hosted** — Everything runs on your machine via Docker Compose
- **Open source** — MIT license, inspect every line
- **BYO model** — OpenAI, Anthropic, Gemini, OpenRouter, or local Ollama
- **5 capabilities** — Search, Fetch, Extract, Browse, and autonomous Agent
- **3 interfaces** — REST API, CLI, and MCP server
- **2 SDKs** — JavaScript/TypeScript and Python
- **Web dashboard** — Visual management and playground
- **15 API endpoints** — Full REST API for programmatic access
- **Safety-first** — robots.txt respect, rate limiting, timeouts, no stealth mode

## Installation

### Quick Start (Docker Compose)

```bash
git clone https://github.com/JonusNattapong/openfinch.git
cd openfinch
cp .env.example .env
# Edit .env and set at least one LLM API key
docker compose up -d
curl http://localhost:8787/health
```

### CLI

```bash
npx @openfinch/cli doctor
npx @openfinch/cli search "latest AI news"
npx @openfinch/cli fetch https://example.com
```

### SDK

```bash
npm install openfinch
```

```javascript
import { OpenFinch } from "openfinch";
const client = new OpenFinch();
const results = await client.search({ query: "AI news", limit: 5 });
```

### MCP (Claude Desktop)

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openfinch": {
      "command": "npx",
      "args": ["-y", "openfinch-mcp"],
      "env": {
        "OPENFINCH_API_URL": "http://localhost:8787"
      }
    }
  }
}
```

## What's Included

- 15 REST API endpoints
- 6 LLM providers (OpenAI, Anthropic, Gemini, OpenRouter, Ollama, OpenAI-compatible)
- Playwright browser automation with session lifecycle
- Autonomous agent with tool use and event tracing
- MCP server with 9 tools
- JS SDK (`npm install openfinch`)
- Python SDK (`pip install openfinch`)
- CLI (`npx @openfinch/cli`)
- Web dashboard (React + Vite)
- Cookbook with 6 recipes and 3 n8n workflow templates
- Claude skill for agent-to-agent collaboration
- Docker Compose with Postgres, Redis, SearXNG, MinIO
- Safety policy (robots.txt, rate limiting, timeouts)
- Comprehensive documentation

## Known Limitations

See [docs/release-notes/v0.1.0.md](docs/release-notes/v0.1.0.md) for known limitations.

## Safety Note

OpenFinch is designed for legitimate web research and automation. It respects robots.txt by default, identifies itself as a bot, enforces rate limits, and does not implement stealth/bot-evasion techniques. It is not intended for adversarial scraping, CAPTCHA bypass, or any use that violates website terms of service.

## Links

- Documentation: ./docs/
- Architecture: [docs/architecture.md](docs/architecture.md)
- API Reference: [docs/api.md](docs/api.md)
- Comparison: [docs/comparison.md](docs/comparison.md)
- Safety Policy: [SAFETY.md](SAFETY.md)
- License: [LICENSE](LICENSE)
