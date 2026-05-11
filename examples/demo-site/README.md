# OpenFinch Demo Site

A local static demo website for testing OpenFinch features without depending on external websites.

## Pages

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Landing page with featured products |
| Products | `/products` | Product listing with 6 products (name, price, category, rating, stock) |
| Product Detail | `/product/laptop` | Single product with specs table |
| Product Detail | `/product/tablet` | Single product with specs |
| Product Detail | `/product/headphones` | Single product |
| Documentation | `/docs` | Article-style content for fetch testing |
| Contact Form | `/form` | Simple form for agent interaction testing |
| JS-Rendered | `/js-rendered` | Content loaded via JavaScript (tests `renderJs` option) |

## APIs

| Endpoint | Response |
|----------|----------|
| `GET /health` | `{"status":"ok","service":"openfinch-demo-site","version":"0.1.0"}` |
| `GET /api/products` | JSON array of 6 products with id, name, price, category, rating, inStock |

## Usage

```bash
# Start the demo site
cd examples/demo-site
node server.js

# Server starts on http://localhost:4173
```

Or from root:
```bash
pnpm demo:site
```

## Testing with OpenFinch

```bash
# Fetch products page
curl -X POST http://localhost:8787/v1/fetch \
  -H 'Content-Type: application/json' \
  -d '{"url": "http://localhost:4173/products", "format": "markdown"}'

# Extract products
curl -X POST http://localhost:8787/v1/extract \
  -H 'Content-Type: application/json' \
  -d '{"url": "http://localhost:4173/products", "prompt": "Extract all product names and prices"}'

# JS-rendered content (requires browser)
curl -X POST http://localhost:8787/v1/fetch \
  -H 'Content-Type: application/json' \
  -d '{"url": "http://localhost:4173/js-rendered", "format": "markdown", "renderJs": true}'
```
