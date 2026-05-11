# Extract Products Recipe

Extract structured product data from the OpenFinch Demo Store using the Extract API.

## Prerequisites

- OpenFinch API running (`docker compose up -d`)
- Demo site running (`pnpm demo:site`)
- LLM provider configured (Ollama recommended for local testing)

## Usage

```bash
export OPENFINCH_API_URL=http://localhost:8787
export DEMO_SITE_URL=http://localhost:4173
export LLM_PROVIDER=ollama

node cookbook/extract-products/index.js
```

## Expected Output

```
=== Extract Products Recipe ===

1. Fetching products page...
   Fetched 3500 chars (150ms)

2. Extracting product data with LLM...

3. Extracted Data (3200ms):
{
  "products": [
    { "name": "QuantumBook Pro", "price": "$1,299", "category": "laptops", "rating": "4.7", "inStock": true },
    ...
  ]
}

Summary: Extracted 6 products
```
