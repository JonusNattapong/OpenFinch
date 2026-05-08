# Demo Preparation Checklist

## Pre-Demo Setup

### Infrastructure
- [ ] Docker Desktop is running
- [ ] `docker compose up -d` completes without errors
- [ ] All containers are healthy: `docker compose ps`
- [ ] Port 8787 is accessible: `curl http://localhost:8787/health`
- [ ] Port 3000 is accessible (dashboard): `curl http://localhost:3000`
- [ ] Terminal window prepared (dark theme, 120×40 minimum)
- [ ] Browser window open at dashboard (http://localhost:3000)

### LLM Provider
- [ ] At least one provider configured in `.env`
- [ ] If using Ollama: model pulled and running
- [ ] If using OpenAI/Anthropic: API key valid and has credits
- [ ] Test: `npx openfinch extract https://example.com "test"`

### SearXNG
- [ ] SearXNG is healthy: `curl http://localhost:8080/search?q=test&format=json`
- [ ] Search returns results: `npx openfinch search "test"`
- [ ] Pre-warm SearXNG cache with common queries

### CLI
- [ ] `npx openfinch doctor` passes all checks
- [ ] `npx openfinch search "web automation"` returns results
- [ ] `npx openfinch fetch https://example.com` works
- [ ] `npx openfinch browser create` creates a session

### MCP (optional)
- [ ] Claude Desktop is installed
- [ ] MCP config added to claude_desktop_config.json
- [ ] Claude Desktop restarted after config change
- [ ] Test: "Search for AI news" in Claude Desktop

## Demo Flow (3-5 minutes)

- [ ] **0:00** — Docker compose up (already running, just mention it)
- [ ] **0:15** — Health check with curl
- [ ] **0:30** — Run `openfinch doctor`
- [ ] **1:00** — Show dashboard overview
- [ ] **1:30** — Run search via CLI
- [ ] **2:00** — Run fetch via CLI
- [ ] **2:30** — Run extract via CLI
- [ ] **3:00** — Browser session create + screenshot (if time allows)
- [ ] **3:30** — Agent run (optional, demos are better without long waits)
- [ ] **4:00** — MCP integration (if applicable)
- [ ] **4:30** — Closing: self-hosted, BYO model, no fee

## Recording Setup (for video demos)

- [ ] Screen recording software ready (OBS, Loom, etc.)
- [ ] 1920×1080 or 1280×720 resolution
- [ ] Terminal font size readable (14-16px)
- [ ] No sensitive info visible (API keys, tokens)
- [ ] Audio level checked (if narrating)
- [ ] Record a practice run first

## Common Demo Failures

- [ ] Docker not running → Check before demo starts
- [ ] Port conflict → Verify with `netstat -ano | findstr :8787`
- [ ] SearXNG not responding → Takes 10-30s to initialize
- [ ] LLM provider timeout → Test before demo, have fallback
- [ ] Browser session limit → Close old sessions first
- [ ] Terminal output too small → Increase font size
- [ ] Network issues → Pre-load all pages that will be fetched

## Post-Demo Cleanup

- [ ] Close browser sessions: `docker compose down`
- [ ] Clear screen/output if sharing terminal
- [ ] Note any issues for improvement
