# Launch Announcement Materials

## GitHub Launch Post

### Repository Description

> **OpenFinch** — Open-source self-hosted AI web agent infrastructure.
> Search, fetch, extract, browse, and run AI web agents from your own machine.
> Bring your own model. Own your data. No platform fee.

### GitHub Release Title

**v0.1.0 — OpenFinch: Self-hosted AI web agents, no strings attached**

### Release Body

```
## What is OpenFinch?

OpenFinch is an open-source platform that runs AI web agents on your own machine.
No hosted platform. No per-request fees. No data leaving your network.

## What can it do?

- **Search** — Private web search via SearXNG
- **Fetch** — Convert any URL to clean markdown
- **Extract** — Structured data extraction using any LLM
- **Browse** — Headless browser sessions with Playwright
- **Agent** — Autonomous web agents that search, browse, and extract

## How is it different?

- Self-hosted — runs on your machine via Docker Compose
- Open source — MIT license, inspect every line
- BYO model — OpenAI, Anthropic, Gemini, OpenRouter, or local Ollama
- Your data stays local — no third-party processing
- MCP server — connects directly to Claude Desktop
- CLI + SDK — Node.js and Python
- Web dashboard — manage everything from a browser
- Cookbook — ready-to-use recipes and n8n workflows

## Quick start

```bash
cp .env.example .env
# Set your LLM API key
docker compose up -d
npx openfinch health
```

That's it. Your self-hosted AI web agent infrastructure is running.

## What's included

- REST API with 12 endpoints
- 5 LLM providers (OpenAI, Anthropic, Gemini, OpenRouter, Ollama)
- Playwright browser automation
- BullMQ job queue with Redis
- Postgres + Drizzle ORM
- MinIO artifact storage
- Web dashboard (React + Vite)
- MCP server for Claude Desktop
- JS SDK (npm: openfinch)
- Python SDK (pip: openfinch)
- CLI tool (npx openfinch)
- Cookbook with n8n workflow templates
- Safety policy with robots.txt respect and rate limiting

## Links

GitHub: https://github.com/openfinch/openfinch
Docs: ./docs/
License: MIT
```

---

## Blog-Style Launch Post

### Title

**Introducing OpenFinch: Self-hosted AI web agents for developers**

### Body

For the past few months, I've been building OpenFinch — an open-source, self-hosted platform for running AI web agents on your own infrastructure.

**The problem:** Most AI web agent platforms are hosted services. You pay per request, your data leaves your network, and you're locked into their model choices. For developers who want full control, this doesn't work.

**The approach:** OpenFinch runs entirely on your machine via Docker Compose. You bring your own LLM API keys — or use local models with Ollama. Your data never hits a third-party server. The code is open (MIT). You can inspect every line.

**The stack:**

- **API Gateway** — Hono REST API with 12 endpoints
- **Search** — SearXNG private meta search (no Google API needed)
- **Fetch** — HTTP-first with Playwright fallback for JS-rendered pages
- **Extract** — LLM-powered structured data extraction
- **Browser** — Playwright Chromium sessions with screenshots
- **Agent** — Autonomous agents that combine all capabilities
- **MCP** — Claude Desktop integration via Model Context Protocol
- **CLI + SDK** — Command-line tool, JS SDK, Python SDK
- **Dashboard** — Web UI for managing everything

**Why self-hosted?**

1. **No platform fee** — Run on your own hardware, pay zero for the platform
2. **Your data stays local** — No third-party processing of your queries
3. **Bring your own model** — Use any provider or local models
4. **Full control** — Rate limits, timeouts, allowed domains, you decide
5. **Transparency** — Open source, MIT license

**What it is not:**

OpenFinch is not a stealth bot platform. It has no CAPTCHA bypass, no proxy rotation, and no IP rotation. It respects robots.txt by default. It identifies itself as a bot. It's designed for legitimate web research and automation — not scraping at scale.

**Getting started:**

```bash
git clone https://github.com/openfinch/openfinch
cd openfinch
cp .env.example .env
# Set your LLM API key
docker compose up -d
npx openfinch health
```

Check the README for full documentation, API reference, and cookbook recipes.

---

## X/Twitter Post

### Post 1 (Launch)

> OpenFinch is out.
>
> Self-hosted AI web agent infrastructure. Open source (MIT).
>
> Search, fetch, extract, browse, and run AI agents from your own machine.
>
> Bring your own model. Own your data. No platform fee.
>
> → github.com/openfinch/openfinch
>
> Docker Compose up and you're running.

### Post 2 (Technical)

> 5 LLM providers. 12 API endpoints. MCP server. CLI. JS SDK. Python SDK. Dashboard.
>
> All running on your machine via Docker Compose.
>
> OpenFinch is open-source self-hosted AI web agents.
>
> → github.com/openfinch/openfinch

### Post 3 (Feature Focus)

> Most "AI web agents" send your data to someone else's servers.
>
> OpenFinch runs entirely on your machine. Your data never leaves.
>
> BYO model (OpenAI, Anthropic, Gemini, Ollama). No platform fee.
>
> → github.com/openfinch/openfinch

---

## LinkedIn Post

**Title:** Just launched OpenFinch — open-source self-hosted AI web agents

**Body:**

I'm excited to share OpenFinch, an open-source platform for running AI web agents on your own infrastructure.

The problem with most AI agent platforms: they're hosted services that charge per-request, process your data on their servers, and lock you into specific models.

OpenFinch takes a different approach — everything runs on your machine via Docker Compose:

- REST API with search, fetch, extract, browse, and agent endpoints
- Support for 5 LLM providers (including local Ollama)
- Playwright-based browser automation
- MCP server for Claude Desktop
- CLI, JS SDK, and Python SDK
- Web dashboard for management
- Built-in safety: robots.txt respect, rate limiting, timeouts

Why self-hosted? Zero platform fee, your data stays local, full control over configuration, and no lock-in to any provider.

MIT licensed. Ready for self-hosting today.

→ github.com/openfinch/openfinch

---

## Reddit / Hacker News Post

### Title

OpenFinch — Self-hosted AI web agent infrastructure (MIT)

### Body

I built OpenFinch because I wanted to run AI web agents without paying per-request fees or sending my data through third-party platforms.

**What it is:**
An open-source stack that runs on your machine via Docker Compose. It gives you search, fetch, extract, browser automation, and autonomous agent capabilities — all through a REST API, CLI, SDK, or MCP server.

**Key design choices:**

- HTTP-first fetch with Playwright fallback (saves resources)
- BullMQ for async job processing
- BYO LLM — OpenAI, Anthropic, Gemini, OpenRouter, or local Ollama
- robots.txt respected by default
- No stealth mode, no proxy rotation — designed for legitimate use
- All data stays on your machine

**Stack:**
Hono API → BullMQ/Redis → Workers (search, fetch, browser, agent) → Postgres + MinIO

**Quick start:**
```bash
git clone https://github.com/openfinch/openfinch
cd openfinch
cp .env.example .env
docker compose up -d
```

MIT license. Would love feedback from the community.

→ github.com/openfinch/openfinch
