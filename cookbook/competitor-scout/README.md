# Competitor Scout Recipe

Multi-step research workflow combining search, fetch, and extract.

## Prerequisites

- OpenFinch API running (`docker compose up -d`)
- SearXNG running (part of Docker Compose)
- LLM provider configured (Ollama recommended)

## Usage

```bash
export OPENFINCH_API_URL=http://localhost:8787
export LLM_PROVIDER=ollama

node cookbook/competitor-scout/index.js "your search query"
```

## Expected Output

```
=== Competitor Scout: "open source web agent tools 2025" ===

Step 1: Searching...
   Found 3 results

Step 2: Fetching top result: https://example.com/article
   Fetched 5200 chars

Step 3: Extracting key information using ollama...

Extracted Data:
{
  "topic": "...",
  "keyPoints": [...],
  "tools": [...]
}

Done (4500ms)
```
