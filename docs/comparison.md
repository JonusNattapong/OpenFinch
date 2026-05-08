# OpenFinch vs Alternatives

OpenFinch is an open-source, self-hosted AI web agent infrastructure.
This page compares it to alternative approaches — not as direct competitors,
but as different tools for different needs.

## Comparison Table

| Feature | OpenFinch | Hosted Web Agent APIs | Browser Automation Platforms | Scraping APIs | Playwright Scripts |
|---------|-----------|----------------------|-----------------------------|---------------|-------------------|
| Self-hosted | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes |
| Open source | ✅ MIT | ❌ Closed | ❌ Closed | ❌ Closed | ✅ Yes |
| Hosted browser runtime | ✅ Included | ✅ Included | ✅ Included | ❌ No | ❌ You build it |
| MCP server | ✅ Built-in | ❌ No | ❌ No | ❌ No | ❌ No |
| CLI tool | ✅ Built-in | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| JS SDK | ✅ Built-in | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| Python SDK | ✅ Built-in | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| Web dashboard | ✅ Built-in | ❌ No | ✅ Yes | ❌ No | ❌ No |
| BYO model | ✅ Any provider | ❌ Fixed model | ❌ N/A | ❌ N/A | ✅ Any |
| Local LLM support | ✅ Ollama | ❌ No | ❌ No | ❌ No | ✅ Yes |
| Search API | ✅ Built-in | ❌ No | ❌ No | ❌ No | ❌ No |
| robots.txt respect | ✅ Default | ❌ No | ❌ No | ❌ No | ❌ Manual |
| Rate limiting | ✅ Built-in | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Manual |
| Data ownership | ✅ Yours | ❌ Theirs | ❌ Theirs | ❌ Theirs | ✅ Yours |
| Platform fee | $0 | $$$ per request | $$$$ per month | $$ per request | $0 |
| Setup time | 5 minutes | Immediate | Immediate | Immediate | Days to weeks |

## Detailed Analysis

### vs Hosted Web Agent APIs (e.g., Playwright MCP, Browserbase, AgentQL)

**Pros of hosted APIs:**
- Zero infrastructure to manage
- Built-in stealth/anti-detection
- Global browser distribution
- Enterprise support

**Where OpenFinch wins:**
- **No platform fee** — run unlimited requests on your own hardware
- **Data privacy** — your queries never leave your network
- **Model freedom** — use any LLM provider or local models
- **Transparency** — inspect every line of code
- **No rate limits** — beyond what your hardware can handle

### vs Browser Automation Platforms (e.g., TinyFish, Browserbear)

**Pros of automation platforms:**
- Visual workflow builders
- Pre-built integrations
- Managed browser infrastructure

**Where OpenFinch wins:**
- **Open source** — no lock-in, self-hosted
- **Local-first** — everything runs on your machine
- **AI-native** — built for LLM-driven extraction and agents
- **Developer tools** — CLI, SDK, MCP server
- **Cost** — zero platform cost at any scale

### vs Scraping APIs (e.g., ScrapingBee, ScraperAPI)

**Pros of scraping APIs:**
- Proxy rotation included
- Anti-bot bypass
- Simple HTTP API

**Where OpenFinch wins:**
- **Not a scraping tool** — OpenFinch is designed for legitimate research and automation
- **Safety-first** — respects robots.txt, no stealth mode
- **Structured extraction** — LLM-powered, not just raw HTML
- **Full stack** — search, fetch, extract, browse, agent
- **Local** — no data sent to third parties

### vs Playwright-Only Scripts

**Pros of Playwright scripts:**
- Full flexibility
- No dependencies on any platform
- Maximum control

**Where OpenFinch wins:**
- **API-first** — no need to write Playwright code for every task
- **Job queue** — BullMQ handles async execution, retries, and concurrency
- **LLM integration** — built-in extraction and agent loop
- **MCP + CLI + SDK** — multiple interfaces without extra work
- **Dashboard** — visual management without coding
- **Workers** — search, fetch, browser, agent workers are pre-built

## When to Choose OpenFinch

OpenFinch is a good fit when:

- You want to run AI web agents on your own infrastructure
- You care about data privacy and want to keep queries local
- You want to choose your own LLM provider
- You need a complete stack (search, fetch, extract, browse, agent)
- You want API, CLI, SDK, and MCP access
- You want zero platform cost at any request volume
- You prefer open-source transparency over black-box services

## When Not to Choose OpenFinch

OpenFinch may not be the right choice when:

- You need stealth/anti-detection browsing
- You need rotating proxies at scale
- You need a managed, zero-ops solution
- You need enterprise support with SLAs
- You need a visual workflow builder (use n8n with our templates)
- You need to bypass CAPTCHAs or website terms of service

## Summary

OpenFinch fills a specific niche: **self-hosted, open-source, AI-native web automation for developers who want control, privacy, and zero platform fees.** It complements existing tools rather than replacing them entirely. Use it alongside Playwright scripts, n8n workflows, or Claude Desktop — not instead of them.
