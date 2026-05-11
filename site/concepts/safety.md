# Safety

OpenFinch is safe by design. Review the [full safety policy](https://github.com/JonusNattapong/OpenFinch/blob/main/SAFETY.md) for details.

## Allowed Use Cases

- Web research and data collection for personal or internal business use
- Monitoring public websites for changes (with rate limiting and robots.txt respect)
- Competitive analysis using publicly available information
- Price monitoring across public e-commerce listings
- Content aggregation and summarization
- Accessibility automation
- Testing and debugging your own web applications
- Educational and academic research

## Prohibited Use Cases

- **CAPTCHA bypass** — Do not attempt to bypass or automate solving of CAPTCHAs
- **Credential stuffing** — Do not use OpenFinch to test stolen credentials
- **Spam automation** — Do not use OpenFinch to post spam content
- **Mass account creation** — Do not create bulk accounts on any service
- **Payment/checkout abuse** — Do not automate purchasing manipulation
- **Unauthorized scraping** — Do not scrape websites prohibited by their Terms of Service
- **Denial of service** — Do not send excessive requests to any server
- **Illegal activity** — Do not use OpenFinch for any illegal purpose

## Built-in Safeguards

### robots.txt Respect

When `RESPECT_ROBOTS_TXT=true` (default), OpenFinch checks `robots.txt` before fetching and respects `Disallow` rules. Blocked paths return a 403 error.

### Domain Rate Limiting

30 requests per 60 seconds per domain (configurable via `RATE_LIMIT_PER_DOMAIN` and `RATE_LIMIT_WINDOW`).

### Strict Timeouts

- Browser sessions: configurable TTL (default: 300 seconds)
- Agent runs: configurable max runtime (default: 180 seconds)

### Max Concurrent Sessions

Browser sessions are limited (`MAX_BROWSER_SESSIONS`, default: 2) to prevent resource exhaustion.

### No Stealth Mode

OpenFinch does not implement bot-detection evasion. The user agent identifies as `OpenFinch/0.1.0`. This ensures transparency about automated access.

### No Proxy Rotation

All traffic originates from your machine's network.

## Local Responsibility

Since OpenFinch is self-hosted and runs on your own infrastructure:
- You are responsible for all actions performed from your machine
- You must comply with the Terms of Service of any website you access
- You must configure appropriate rate limits for your use case
- You must ensure your LLM API usage complies with your provider's terms
