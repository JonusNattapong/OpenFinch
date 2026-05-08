# OpenFinch Safety Policy

OpenFinch is a self-hosted AI web agent infrastructure. You run it on your own machine. You control what it does.

## Allowed Use Cases

- Web research and data collection for personal or internal business use
- Monitoring public websites for changes (with rate limiting and robots.txt respect)
- Competitive analysis using publicly available information
- Price monitoring across public e-commerce listings
- Content aggregation and summarization
- Accessibility automation (e.g., filling forms on behalf of users with disabilities)
- Testing and debugging your own web applications
- Educational and academic research

## Prohibited Use Cases

The following are strictly prohibited when using OpenFinch:

- **CAPTCHA bypass** — Do not attempt to bypass or automate solving of CAPTCHA challenges.
- **Credential stuffing** — Do not use OpenFinch to test stolen credentials or automate login attempts.
- **Spam automation** — Do not use OpenFinch to post spam comments, messages, or content.
- **Mass account creation** — Do not use OpenFinch to create bulk accounts on any service.
- **Payment/checkout abuse** — Do not use OpenFinch to automate purchasing, coupon abuse, or checkout manipulation.
- **Unauthorized scraping** — Do not scrape websites that prohibit it in their Terms of Service.
- **Denial of service** — Do not use OpenFinch to send excessive requests to any server.
- **Illegal activity** — Do not use OpenFinch for any illegal purpose.

## Built-in Safeguards

### robots.txt Respect
When `RESPECT_ROBOTS_TXT=true` (default), OpenFinch checks `robots.txt` before fetching any URL and respects `Disallow` rules. Disabled paths return a 403 error.

### Domain-Level Rate Limiting
OpenFinch applies per-domain rate limiting to prevent accidental request floods. Default: 30 requests per 60 seconds per domain.

### Strict Timeouts
All browser sessions have configurable TTL (default: 300 seconds). Agent runs have configurable max runtime (default: 180 seconds). This prevents runaway automation.

### Max Concurrent Sessions
Browser sessions are limited (`MAX_BROWSER_SESSIONS`, default: 2) to prevent resource exhaustion on the host machine.

### No Stealth Mode
OpenFinch does not implement stealth/bot-detection evasion by default. The user agent identifies as "OpenFinch/0.1.0 (self-hosted AI web agent)". This ensures transparency about automated access.

### No Proxy Rotation
OpenFinch does not rotate IPs or proxies. All traffic comes from the host machine's network.

## Local Responsibility

Since OpenFinch is self-hosted and runs on your own infrastructure:

- **You are responsible** for all actions performed by OpenFinch from your machine.
- **You must comply** with the Terms of Service of any website you access through OpenFinch.
- **You must configure** appropriate rate limits for your use case.
- **You must ensure** your LLM API usage complies with your provider's terms.

## Reporting Issues

If you discover a safety issue or vulnerability in OpenFinch, please open a GitHub issue or contact the maintainers.

## License

OpenFinch is open-source software. The safety policy described here is a guideline for users. Users are solely responsible for how they use the software.
