# Fetch Documentation Recipe

Convert any URL to clean markdown using the OpenFinch Fetch API.

## Prerequisites

- OpenFinch API running (`docker compose up -d`)

## Usage

```bash
export OPENFINCH_API_URL=http://localhost:8787

node examples/fetch-docs/index.js "https://example.com"
```

## Expected Output

```
Fetching: https://example.com

Title: Example Domain
Content:
# Example Domain

This domain is for use in illustrative examples...
```

## Formats

The Fetch API supports multiple output formats:
- `markdown` (default) — Clean markdown conversion
- `text` — Plain text only
- `html` — Raw HTML
- `json` — Structured JSON with metadata
