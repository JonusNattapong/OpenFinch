# OpenFinch Demo Script

**Duration:** 3-5 minutes
**Audience:** Developers, technical founders, AI engineers
**Goal:** Show how easy it is to run OpenFinch and get value immediately

---

## Setup (30 seconds)

```bash
# Start all services
docker compose up -d

# Wait for services to be ready
echo "Waiting for services..."
sleep 10
```

**Narrator:** "OpenFinch runs entirely on your machine via Docker Compose. One command starts everything — API, dashboard, workers, database, search engine, and storage."

---

## Step 1: Check Health (30 seconds)

```bash
# Check API is running
curl http://localhost:8787/health

# Or use the CLI
npx openfinch health
```

**PowerShell:**
```powershell
curl.exe http://localhost:8787/health
```

**Narrator:** "Health endpoint confirms everything is running. Version, uptime, and services all in one call."

---

## Step 2: Run Diagnostics (30 seconds)

```bash
npx openfinch doctor
```

**Narrator:** "The doctor command checks every component — API, Redis, Postgres, SearXNG, browser sessions, and LLM providers. Green means ready to use."

---

## Step 3: Search the Web (30 seconds)

```bash
npx openfinch search "latest AI research papers 2026"
```

**PowerShell:**
```powershell
npx openfinch search "latest AI research papers 2026"
```

**Narrator:** "Search queries SearXNG — a private meta search engine — and returns structured results. No ads, no tracking, no API keys needed."

---

## Step 4: Fetch a Page (30 seconds)

```bash
npx openfinch fetch https://example.com
```

**Narrator:** "Fetch converts any web page to clean markdown. HTML, scripts, and navigation stripped automatically. Ready for reading or LLM processing."

---

## Step 5: Extract Structured Data (30 seconds)

```bash
npx openfinch extract https://example.com "Extract all headings and links"
```

**Narrator:** "Extract uses your LLM of choice to turn unstructured web content into structured JSON. Schema-guided extraction for precise results."

---

## Step 6: Browser Automation (30 seconds)

```bash
# Create a browser session
npx openfinch browser create

# Take a screenshot (replace with your session ID)
npx openfinch browser screenshot <session-id>

# Close the session
npx openfinch browser close <session-id>
```

**Narrator:** "Browser sessions run in headless Chromium via Playwright. Full page rendering, screenshots, and interaction — all running locally."

---

## Step 7: Run an AI Agent (30 seconds)

```bash
npx openfinch agent run "Find the price of the latest iPhone from Apple's website"
```

**Narrator:** "The agent combines search, browse, extract, and LLM reasoning into autonomous task completion. Each step is traceable via events."

---

## Step 8: MCP Integration (30 seconds)

```json
{
  "mcpServers": {
    "openfinch": {
      "command": "npx",
      "args": ["-y", "openfinch-mcp"],
      "env": {
        "OPENFINCH_API_URL": "http://localhost:8787"
      }
    }
  }
}
```

**Narrator:** "MCP server connects OpenFinch to Claude Desktop. Your AI assistant can search the web, fetch pages, extract data, and control a browser — all through natural language."

---

## Closing (15 seconds)

**Narrator:** "Everything runs on your machine. Your data never leaves. You bring your own LLM key — or use local models with Ollama. No platform fee, no lock-in, no surprises."

---

## Full Demo Script (copy-paste ready)

```bash
#!/bin/bash
# OpenFinch 3-Minute Demo

echo "=== OpenFinch Demo ==="

# 1. Start
docker compose up -d
sleep 5

# 2. Health
echo "--- Health ---"
curl -s http://localhost:8787/health | head -c 200

# 3. Doctor
echo -e "\n--- Doctor ---"
npx openfinch doctor

# 4. Search
echo -e "\n--- Search ---"
npx openfinch search "web automation" | head -c 500

# 5. Fetch
echo -e "\n--- Fetch ---"
npx openfinch fetch https://example.com | head -c 500

# 6. Browser
echo -e "\n--- Browser ---"
npx openfinch browser create

echo -e "\n=== Demo Complete ==="
```

**PowerShell version:**
```powershell
# OpenFinch 3-Minute Demo (PowerShell)
Write-Host "=== OpenFinch Demo ==="

# 1. Start
docker compose up -d
Start-Sleep -Seconds 5

# 2. Health
Write-Host "--- Health ---"
curl.exe -s http://localhost:8787/health

# 3. Doctor
Write-Host "--- Doctor ---"
npx openfinch doctor

# 4. Search
Write-Host "--- Search ---"
npx openfinch search "web automation"

# 5. Fetch
Write-Host "--- Fetch ---"
npx openfinch fetch https://example.com

Write-Host "=== Demo Complete ==="
```

## Pro Tips

- Pre-warm by running `docker compose up -d` before the demo
- Have SearXNG indexed some common queries for faster search results
- Use a local Ollama model for the extract demo to avoid API latency
- Pre-open Claude Desktop with MCP config ready to show
- Keep a browser tab open on the dashboard for quick switching
