# Basic Search Recipe

Search the web and parse results using the OpenFinch Search API.

## Prerequisites

- OpenFinch API running (`docker compose up -d`)
- SearXNG running (part of Docker Compose)

## Usage

```bash
export OPENFINCH_API_URL=http://localhost:8787

node examples/basic-search/index.js "your search query"

# Or with explicit limit
node examples/basic-search/index.js "AI news" 10
```

## Expected Output

```
Searching for: "your search query" (limit: 5)

Found 5 results in 1200ms:

[1] Result Title
    https://example.com/page
    Snippet text...
```
