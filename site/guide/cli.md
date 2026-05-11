# CLI

The `openfinch` CLI connects to your running OpenFinch instance.

## Installation

```bash
# Global install
npm install -g @openfinch/cli

# Or use npx (no install needed)
npx @openfinch/cli health
```

## Configuration

The CLI stores config in `~/.config/openfinch/config.json`:

```bash
# Show current config
openfinch config list

# Set a value
openfinch config set apiUrl http://localhost:8787

# Get a specific value
openfinch config get apiUrl

# Reset to defaults
openfinch config reset
```

Config keys: `apiUrl`, `dashboardUrl`, `provider`, `model`, `maxSteps`

Environment variables override config: `OPENFINCH_API_URL`, `OPENFINCH_DASHBOARD_URL`.

## Commands

### `openfinch health`

Check API health status.

```bash
openfinch health
# ✓ API is healthy
# {"status":"ok","version":"0.1.0","uptime":42}
```

### `openfinch doctor`

Run system diagnostics. Checks API, SearXNG, Redis, Postgres, browser sessions, LLM providers, and Docker Compose.

```bash
openfinch doctor
```

### `openfinch search <query>`

Search the web.

```bash
openfinch search "latest AI tools"
openfinch search "web automation" --limit 5
```

### `openfinch fetch <url>`

Fetch a URL and return content.

```bash
openfinch fetch https://example.com
```

### `openfinch extract <url> [prompt]`

Extract structured data from a page.

```bash
openfinch extract https://example.com "Extract the main heading"
openfinch extract https://news.ycombinator.com "Extract all post titles"
```

### `openfinch browser`

Manage browser sessions.

```bash
openfinch browser create           # Create a session
openfinch browser screenshot <id>  # Take screenshot
openfinch browser close <id>       # Close session
```

### `openfinch agent`

Manage autonomous agent runs.

```bash
openfinch agent run <goal>              # Start a run
openfinch agent get <run-id>           # Get run status
openfinch agent result <run-id>        # Get result
openfinch agent events <run-id>        # Get event trace
```

### `openfinch init`

Scaffold a new project from a template.

```bash
openfinch init                         # List available templates
openfinch init --template basic-research    # Scaffold basic research
openfinch init --template product-scraper my-scraper
```

Available templates:
- `basic-research` — Search + fetch workflow
- `product-scraper` — LLM-powered product data extraction
- `agent-workflow` — Autonomous multi-step agent script

## Examples

```bash
# Full research workflow
openfinch search "best price monitoring tools"
openfinch fetch https://example.com/pricing
openfinch extract https://example.com/pricing "Extract all pricing plans"

# Browser automation
openfinch browser create
openfinch browser screenshot session_abc123

# Agent workflow
openfinch agent run "Go to example.com and extract the main heading"
openfinch agent result run_xyz789
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENFINCH_API_URL` | http://localhost:8787 | API endpoint |
| `OPENFINCH_DASHBOARD_URL` | http://localhost:3000 | Dashboard URL |
