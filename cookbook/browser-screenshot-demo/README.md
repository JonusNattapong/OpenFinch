# Browser Screenshot Demo Recipe

Demonstrates browser session lifecycle: create, screenshot, and close.

## Prerequisites

- OpenFinch API running (`docker compose up -d`)
- Demo site running (`pnpm demo:site`)

## Usage

```bash
export OPENFINCH_API_URL=http://localhost:8787
export DEMO_SITE_URL=http://localhost:4173

node cookbook/browser-screenshot-demo/index.js
```

## Expected Output

```
=== Browser Screenshot Demo ===

1. Creating browser session...
   Session created: abc123-def-456

2. Navigating to demo site products page...
   Page fetched (250ms)

3. Capturing screenshot...
   Screenshot saved to: screenshot.png

4. Closing session...
   Session closed

Done! Screenshot saved to screenshot.png
```
