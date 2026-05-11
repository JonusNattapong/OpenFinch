# Comparison

OpenFinch vs alternative approaches.

## Feature Comparison

| Feature | OpenFinch | Hosted Web Agent APIs | Browser Platforms | Scraping APIs | Playwright Scripts |
|---------|-----------|----------------------|-------------------|---------------|-------------------|
| Self-hosted | ✅ | ❌ | ❌ | ❌ | ✅ |
| Open source (MIT) | ✅ | ❌ | ❌ | ❌ | ✅ |
| Search API | ✅ | ❌ | ❌ | ❌ | ❌ |
| LLM Extraction | ✅ | ✅ | ❌ | ❌ | ❌ |
| Browser Sessions | ✅ | ✅ | ✅ | ❌ | ❌ |
| Autonomous Agent | ✅ | ✅ | ❌ | ❌ | ❌ |
| MCP Server | ✅ | ❌ | ❌ | ❌ | ❌ |
| CLI Tool | ✅ | ✅ | ❌ | ✅ | ❌ |
| JS + Python SDK | ✅ | ✅ | ✅ | ✅ | ❌ |
| Web Dashboard | ✅ | ❌ | ✅ | ❌ | ❌ |
| BYO Model | ✅ | ❌ | N/A | N/A | ✅ |
| Local LLM | ✅ | ❌ | ❌ | ❌ | ✅ |
| robots.txt Respect | ✅ | ❌ | ❌ | ❌ | ❌ |
| Data Ownership | ✅ Your machine | ❌ Their cloud | ❌ Their cloud | ❌ Their cloud | ✅ Yours |
| Platform Fee | **$0** | $$$$ | $$$$ | $$ | $0 |
| Setup Time | 5 min | Immediate | Immediate | Immediate | Days–weeks |

## When to Choose OpenFinch

- You want to run AI web agents on your own infrastructure
- You care about data privacy and keeping queries local
- You want to choose your own LLM provider
- You need a complete stack: search, fetch, extract, browse, agent
- You want API, CLI, SDK, and MCP access
- You want zero platform cost at any request volume
- You prefer open-source transparency over black-box services

## When Not to Choose OpenFinch

- You need stealth/anti-detection browsing
- You need rotating proxies at scale
- You need a managed, zero-ops solution with enterprise support
- You need a visual workflow builder (use n8n with our templates)
- You need to bypass CAPTCHAs or website terms of service

## Summary

OpenFinch fills a specific niche: **self-hosted, open-source, AI-native web automation for developers who want control, privacy, and zero platform fees.** It complements existing tools rather than replacing them. Use it alongside Playwright scripts, n8n workflows, or Claude Desktop.
