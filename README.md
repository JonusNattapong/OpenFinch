# OpenFinch

**Open-source self-hosted AI web agent infrastructure.**
Search, fetch, extract, browse, and run AI web agents from your own machine.

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/openfinch/openfinch/actions/workflows/ci.yml/badge.svg)](https://github.com/openfinch/openfinch/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/openfinch)](https://www.npmjs.com/package/openfinch)
[![npm downloads](https://img.shields.io/npm/dm/openfinch)](https://www.npmjs.com/package/openfinch)
[![Python](https://img.shields.io/pypi/v/openfinch)](https://pypi.org/project/openfinch/)
[![Docker](https://img.shields.io/badge/docker-compose-blue)](infra/docker-compose.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

**Bring your own model. Own your data. No platform fee.**

---

## What is OpenFinch?

OpenFinch is a complete, self-hosted platform for running AI web agents on your own infrastructure. It combines **search**, **fetch**, **extract**, **browser automation**, and **autonomous agents** into one unified API — accessible via REST, CLI, SDK, MCP, or web dashboard.

Unlike hosted AI agent platforms, OpenFinch runs entirely on your machine via Docker Compose. Your data never leaves your network. You choose the LLM provider — or use local models with Ollama. No per-request fees, no data sharing, no lock-in.

```bash
# One command to start everything
docker compose up -d

# Everything is running
curl http://localhost:8787/health
```

> **Designed for:** Developers building AI-powered research tools, automation workflows, data extraction pipelines, and intelligent browsing agents.
> **Not for:** Stealth scraping, CAPTCHA bypass, proxy rotation, or unethical data collection.

---

## Product Comparison

| Feature | OpenFinch | Hosted Web Agent APIs | Browser Autom. Platforms | Scraping APIs |
|---------|-----------|----------------------|-------------------------|---------------|
| Self-hosted | ✅ | ❌ | ❌ | ❌ |
| Open source (MIT) | ✅ | ❌ | ❌ | ❌ |
| Search API | ✅ Built-in | ❌ | ❌ | ❌ |
| Fetch + Markdown | ✅ Built-in | ✅ | ❌ | ✅ |
| LLM Extraction | ✅ BYO model | ✅ Fixed model | ❌ | ❌ |
| Browser Sessions | ✅ Playwright | ✅ | ✅ | ❌ |
| Autonomous Agent | ✅ | ✅ | ❌ | ❌ |
| MCP Server | ✅ Built-in | ❌ | ❌ | ❌ |
| CLI Tool | ✅ Built-in | ✅ | ❌ | ✅ |
| JS + Python SDK | ✅ Both | ✅ Both | ✅ Both | ✅ Both |
| Web Dashboard | ✅ Built-in | ❌ | ✅ | ❌ |
| robots.txt Respect | ✅ Default | ❌ | ❌ | ❌ |
| Data Ownership | ✅ Your machine | ❌ Their cloud | ❌ Their cloud | ❌ Their cloud |
| Platform Fee | **$0** | $$$ per request | $$$$ per month | $$ per request |

[Full comparison →](docs/comparison.md)

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 22+ (for CLI/SDK dev)
- pnpm 10+ (for local dev)
- 4GB+ RAM (8GB+ recommended with browser)

### 1. Clone and configure

```bash
git clone https://github.com/openfinch/openfinch.git
cd openfinch
cp .env.example .env
# Edit .env and set at least one LLM key (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
```

### 2. Start everything

```bash
docker compose up -d
```

### 3. Verify it's running

```bash
curl http://localhost:8787/health
# {"status":"ok","version":"0.1.0","uptime":42,...}
```

### 4. Run your first search

```bash
curl -X POST http://localhost:8787/v1/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "latest AI news", "limit": 5}'
```

Done. Your self-hosted AI web agent infrastructure is running.

---

## Architecture

```

User/Client → API Gateway (:8787) → BullMQ → Workers
                                      │
                            Postgres + Redis + MinIO


CLI / SDK / MCP / Dashboard → same API → same infrastructure
```

[Architecture docs →](docs/architecture.md)

### Capability Escalation Model

```
search → fetch → extract → agent → browser
(lightest)                         (heaviest)
```

Always start with the lightest capability. Only spin up a browser when you need visual rendering or JavaScript execution.

### Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 8787 | REST API (Hono) |
| Dashboard | 3000 | Web UI (React + Vite) |
| MCP Server | 8788 | MCP protocol (stdio) |
| Postgres | 5432 | Database (Drizzle ORM) |
| Redis | 6379 | Queue + Cache (BullMQ) |
| SearXNG | 8080 | Meta search engine |
| MinIO | 9000 | Artifact storage (S3) |
| Workers | — | BullMQ consumers |

---

## Features

### Search
Private web search via SearXNG — no Google API keys needed. Structured results with title, URL, snippet, and source.

```bash
@openfinch/cli search "web automation tools"
```

### Fetch
Convert any URL to clean markdown. HTTP-first with Playwright fallback for JavaScript-rendered pages. Respects robots.txt by default.

```bash
@openfinch/cli fetch https://example.com
```

### Extract
LLM-powered structured data extraction. Provide a prompt or a JSON schema. Works with any configured provider.

```bash
@openfinch/cli extract https://example.com "Extract all product prices"
```

### Browser
Headless Chromium sessions via Playwright. Create sessions, take screenshots, and close them programmatically. Auto-expiry to prevent resource leaks.

```bash
@openfinch/cli browser create
```

### Agent
Autonomous web agents that combine search, browse, and extraction with LLM reasoning. Event tracing for full transparency.

```bash
@openfinch/cli agent run "Find pricing for product X on example.com"
```

---

## CLI

The `openfinch` CLI connects to your running instance:

```bash
npx @openfinch/cli health       # Check API health
npx @openfinch/cli doctor       # Run system diagnostics
npx @openfinch/cli search <q>   # Search the web
npx @openfinch/cli fetch <url>  # Fetch a URL
npx @openfinch/cli extract <url> [prompt]  # Extract data
npx @openfinch/cli browser create|screenshot|close  # Browser management
npx @openfinch/cli agent run|get|result|events  # Agent management
npx @openfinch/cli init         # Getting started guide
```

[CLI reference →](docs/cli.md)

---

## MCP Server

OpenFinch includes an MCP server for Claude Desktop, VS Code, Cursor, and Windsurf:

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

**Available MCP tools:**
| Tool | Description |
|------|-------------|
| `openfinch_search` | Search the web |
| `openfinch_fetch` | Fetch URL as markdown |
| `openfinch_extract` | Extract structured data |
| `openfinch_browser_create_session` | Start browser session |
| `openfinch_browser_screenshot` | Capture screenshot |
| `openfinch_browser_close_session` | Close session |
| `openfinch_agent_run` | Run autonomous agent |
| `openfinch_agent_get_result` | Get agent result |
| `openfinch_agent_get_events` | Get agent trace |

[MCP docs →](docs/mcp.md)

---

## SDK

### JavaScript/TypeScript

```bash
npm install openfinch
```

```javascript
import { OpenFinch } from "openfinch";

const client = new OpenFinch();

// Search
const results = await client.search({ query: "AI news", limit: 5 });

// Fetch
const page = await client.fetch({ url: "https://example.com" });

// Extract
const data = await client.extract({ url: "https://example.com", prompt: "Extract products" });

// Browser
const session = await client.browser.createSession();
const screenshot = await client.browser.screenshot(session.sessionId);
await client.browser.close(session.sessionId);

// Agent
const run = await client.agent.run({ goal: "Find prices on example.com" });
const result = await client.agent.result(run.runId);
```

### Python

```bash
pip install openfinch
```

```python
from openfinch import OpenFinch

client = OpenFinch()
results = client.search("AI news", limit=5)
page = client.fetch("https://example.com")
data = client.extract("https://example.com", prompt="Extract products")
```

---

## LLM Providers

Configure one or more providers in `.env`:

| Provider | Env Variable | Default Model |
|----------|-------------|---------------|
| OpenAI | `OPENAI_API_KEY` | gpt-4o |
| Anthropic | `ANTHROPIC_API_KEY` | claude-sonnet-4-20250514 |
| Gemini | `GEMINI_API_KEY` | gemini-2.0-flash |
| OpenRouter | `OPENROUTER_API_KEY` | gpt-4o |
| Ollama (local) | `OLLAMA_BASE_URL` | llama3.2 |
| OpenAI-compatible | `OPENAI_COMPATIBLE_BASE_URL` | configurable |

Auto-selection priority: OpenAI → Anthropic → OpenRouter → Gemini → Ollama

[Providers docs →](docs/providers.md)

---

## Dashboard

OpenFinch includes a web dashboard at `http://localhost:3000`.

- System status overview
- Search/Fetch/Extract playgrounds
- Browser session management
- Agent run interface with event tracing
- Provider configuration viewer

> Requires `--profile full` in Docker Compose.

---

## Cookbook

Ready-to-use recipes for common tasks:

| Recipe | Description |
|--------|-------------|
| [Basic Search](cookbook/basic-search/) | Search the web and parse results |
| [Fetch Documentation](cookbook/fetch-docs/) | Convert any page to readable markdown |
| [Extract Products](cookbook/extract-products/) | Extract structured product data |
| [Competitor Scout](cookbook/competitor-scout/) | Multi-step research workflow |
| [Browser Screenshot](cookbook/browser-screenshot-demo/) | Capture website screenshots |
| [Agent Form Demo](cookbook/agent-form-demo/) | Autonomous form filling agent |
| [n8n Workflows](cookbook/n8n-workflows/) | Importable n8n automation templates |

---

## Safety

OpenFinch is safe by design:

- **robots.txt respected** by default — blocked paths return 403
- **Domain rate limiting** — 30 requests per 60 seconds per domain
- **Strict timeouts** — configurable browser session TTL, agent runtime limits
- **No stealth mode** — identifies itself as a bot
- **No CAPTCHA bypass** — not designed for adversarial scraping
- **No proxy rotation** — all traffic from your machine
- **Max concurrent sessions** — configurable to prevent resource exhaustion

[Full safety policy →](SAFETY.md)

---

## Project Structure

```
openfinch/
├── apps/
│   ├── api/              # REST API (Hono)
│   └── dashboard/        # Web UI (React + Vite)
├── services/
│   ├── search-worker/    # SearXNG consumer
│   ├── fetch-worker/     # HTTP fetch consumer
│   ├── browser-worker/   # Playwright pool
│   ├── agent-worker/     # Agent engine
│   └── mcp-server/       # MCP protocol server
├── packages/
│   ├── sdk-js/           # JavaScript SDK
│   ├── sdk-python/       # Python SDK
│   ├── cli/              # CLI tool
│   ├── schemas/          # Zod schemas
│   └── shared/           # Shared utilities
├── cookbook/             # Usage recipes
├── docs/                 # Documentation
├── assets/               # Brand & launch assets
└── infra/                # Docker configs
```

---

## Roadmap

- [x] REST API with health, search, fetch, extract, browser, agent endpoints
- [x] LLM providers: OpenAI, Anthropic, Gemini, OpenRouter, Ollama
- [x] Browser automation (Playwright sessions, screenshots)
- [x] Autonomous agent with tool use and event tracing
- [x] MCP server for Claude Desktop
- [x] JS and Python SDKs
- [x] CLI tool
- [x] Web dashboard
- [x] Docker Compose deployment
- [x] Cookbook with recipes and n8n templates
- [x] Safety policy
- [ ] CLI enhancements (config management, project templates)
- [ ] Response caching via Postgres
- [ ] Agent skill for Claude Code
- [ ] Docs site
- [ ] One-line deploy script

---

## Development

```bash
# Install
pnpm install

# Build all packages
pnpm build

# Run API in dev mode
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck
```

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- Report bugs via [GitHub Issues](.github/ISSUE_TEMPLATE/bug_report.yml)
- Suggest features via [Feature Requests](.github/ISSUE_TEMPLATE/feature_request.yml)
- Submit pull requests — see [PR template](.github/pull_request_template.md)

---

## License

MIT © OpenFinch. See [LICENSE](LICENSE) for details.
