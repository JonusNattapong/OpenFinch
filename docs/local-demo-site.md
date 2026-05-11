# Local Demo Site

A static demo website for testing OpenFinch features without external dependencies.

## Overview

The demo site (`examples/demo-site/`) provides predictable HTML content for:
- **Fetch** — Convert pages to markdown/text/html
- **Extract** — Extract structured data with LLM
- **Browser** — Screenshot and interaction tests
- **Agent** — Form filling and navigation

## Pages

| Page | Description | URL |
|------|-------------|-----|
| Home | Landing page with links | `/` |
| Products | 6 products with name, price, category, rating | `/products` |
| Product Detail | Individual product pages with specs | `/product/laptop` |
| Documentation | Article-style content for fetch testing | `/docs` |
| Contact Form | Simple form for agent interaction | `/form` |
| JS-Rendered | Content loaded via JavaScript | `/js-rendered` |

## API Endpoints

| Endpoint | Returns |
|----------|---------|
| `GET /health` | `{"status":"ok","service":"openfinch-demo-site"}` |
| `GET /api/products` | JSON array of 6 products |

## Usage

```bash
# Start standalone
cd examples/demo-site
node server.js

# Or from root
pnpm demo:site
```

The server starts on port 4173 by default. Override with `DEMO_SITE_PORT`.

## Testing Examples

### Fetch
```bash
curl -X POST http://localhost:8787/v1/fetch \
  -H 'Content-Type: application/json' \
  -d '{"url":"http://localhost:4173/products","format":"markdown"}'
```

### Extract
```bash
curl -X POST http://localhost:8787/v1/extract \
  -H 'Content-Type: application/json' \
  -d '{"url":"http://localhost:4173/products","prompt":"Extract all product names","provider":"ollama"}'
```

### JS-Rendered Content
```bash
curl -X POST http://localhost:8787/v1/fetch \
  -H 'Content-Type: application/json' \
  -d '{"url":"http://localhost:4173/js-rendered","format":"markdown","renderJs":true}'
```
