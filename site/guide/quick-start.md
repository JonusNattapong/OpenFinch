# Quick Start

Get OpenFinch running and make your first API call in 2 minutes.

## 1. Start OpenFinch

```bash
git clone https://github.com/JonusNattapong/OpenFinch.git
cd OpenFinch
cp .env.example .env
# Set OPENAI_API_KEY in .env
docker compose up -d
```

Verify it's running:

```bash
curl http://localhost:8787/health
# {"status":"ok","version":"0.1.0"}
```

## 2. Search the Web

```bash
curl -X POST http://localhost:8787/v1/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "latest AI news", "limit": 5}'
```

## 3. Fetch a Page

```bash
curl -X POST http://localhost:8787/v1/fetch \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com", "format": "markdown"}'
```

## 4. Extract Structured Data

```bash
curl -X POST http://localhost:8787/v1/extract \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://news.ycombinator.com",
    "prompt": "Extract all post titles and point counts"
  }'
```

## 5. Run a Browser Session

```bash
# Create a session
SESSION=$(curl -s -X POST http://localhost:8787/v1/browser/session \
  -H 'Content-Type: application/json' \
  -d '{"headless": true}' | jq -r '.sessionId')

# Take a screenshot
curl -X POST "http://localhost:8787/v1/browser/session/$SESSION/screenshot" \
  -o screenshot.png

# Close the session
curl -X DELETE "http://localhost:8787/v1/browser/session/$SESSION"
```

## 6. Run an Autonomous Agent

```bash
curl -X POST http://localhost:8787/v1/agent/run \
  -H 'Content-Type: application/json' \
  -d '{
    "goal": "Go to example.com and extract the main heading and paragraph",
    "startUrl": "https://example.com",
    "maxSteps": 5
  }'
```

Poll for the result:

```bash
# Replace run_xxx with your run ID
curl http://localhost:8787/v1/agent/run/run_xxx

# Get full event trace
curl http://localhost:8787/v1/agent/run/run_xxx/events
```

## 7. Use the CLI

```bash
npx @openfinch/cli search "web automation tools"
npx @openfinch/cli fetch https://example.com
npx @openfinch/cli doctor
```

## What's Next?

- [CLI Reference](/guide/cli) — Full CLI documentation
- [MCP Server](/guide/mcp) — Connect to Claude Desktop
- [SDK Setup](/guide/sdk) — JavaScript and Python SDKs
- [API Reference](/api/overview) — Full API documentation
