# Extract API

LLM-powered structured data extraction from any webpage.

## Endpoint

```
POST /v1/extract
```

## Request

```json
{
  "url": "https://example.com/products",   // Required
  "prompt": "Extract all product names and prices",  // Required (max 2000 chars)
  "schema": {},                             // Optional. JSON schema for structured output
  "provider": "openai",                    // Optional. See LLM providers
  "model": "gpt-4o"                       // Optional. Specific model
}
```

### `prompt`

Natural language description of what to extract. The LLM will return structured data matching your request.

### `schema`

Optional JSON Schema for deterministic structured output:

```json
{
  "url": "https://example.com/products",
  "prompt": "Extract all products",
  "schema": {
    "type": "object",
    "properties": {
      "products": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "price": { "type": "string" },
            "inStock": { "type": "boolean" }
          }
        }
      }
    }
  }
}
```

## Response

```json
{
  "data": {
    "products": [
      {
        "name": "Widget Pro",
        "price": "$99.00",
        "inStock": true
      }
    ]
  },
  "url": "https://example.com/products",
  "provider": "openai",
  "model": "gpt-4o",
  "tokens": 1234,
  "cached": false
}
```

## Examples

### Extract with Prompt

```bash
curl -X POST http://localhost:8787/v1/extract \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://news.ycombinator.com",
    "prompt": "Extract all post titles and their point counts"
  }'
```

### Extract with Schema

```bash
curl -X POST http://localhost:8787/v1/extract \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com/jobs",
    "prompt": "Extract job listings",
    "schema": {
      "type": "object",
      "properties": {
        "jobs": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "company": { "type": "string" },
              "location": { "type": "string" },
              "salary": { "type": "string" }
            }
          }
        }
      }
    }
  }'
```

### Use Specific Provider

```bash
curl -X POST http://localhost:8787/v1/extract \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "prompt": "Extract all pricing information",
    "provider": "anthropic"
  }'
```

## Notes

- Results are cached for 1 hour
- Extract internally uses the Fetch API, so all fetch options apply
- Provider/model can be specified per-request or defaulted in `.env`
- Token usage is included in the response for cost tracking
