# Screenshots Needed

These screenshots should be captured from a running OpenFinch instance
for the README, docs site, and social media.

## README Screenshots

### 1. Dashboard Overview
**Path:** `assets/screenshots/dashboard-overview.png`
**Description:** Full dashboard page showing:
- Health status (all green)
- Recent activity feed
- Quick action buttons (Search, Fetch, Extract)
- Provider configuration status
**How to capture:** Start Docker Compose, open `http://localhost:3000`

### 2. CLI Doctor Output
**Path:** `assets/screenshots/cli-doctor.png`
**Description:** Terminal output of `openfinch doctor` showing all checks passed
**How to capture:** `npx openfinch doctor` with all services running

### 3. Search Results
**Path:** `assets/screenshots/search-results.png`
**Description:** JSON response from a search query showing titles, URLs, snippets
**How to capture:** `openfinch search "web automation tools"` or via Dashboard search playground

### 4. Fetch Result
**Path:** `assets/screenshots/fetch-result.png`
**Description:** Markdown output from fetching a URL
**How to capture:** `openfinch fetch https://example.com`

### 5. Extract Result
**Path:** `assets/screenshots/extract-result.png`
**Description:** Structured JSON output from extraction
**How to capture:** `openfinch extract https://example.com "Extract main content"`

### 6. Browser Session
**Path:** `assets/screenshots/browser-session.png`
**Description:** Browser session created and screenshot captured
**How to capture:** Dashboard browser playground or CLI commands

### 7. Agent Trace
**Path:** `assets/screenshots/agent-trace.png`
**Description:** Agent run showing thought → action → observation loop
**How to capture:** Dashboard agent run view or CLI `openfinch agent events`

### 8. MCP Configuration
**Path:** `assets/screenshots/mcp-config.png`
**Description:** Claude Desktop config showing OpenFinch MCP server
**How to capture:** Screenshot of `claude_desktop_config.json` and Claude Desktop with MCP tools visible

## Social Media Screenshots

### 9. Architecture Overview
**Path:** `assets/screenshots/architecture-overview.png`
**Description:** The Mermaid architecture diagram rendered as an image
**How to capture:** Render `assets/diagrams/architecture.mmd` using mermaid-cli or an online renderer

## Style Guide for Screenshots

- Terminal screenshots: Use dark theme (Slate BG), font size 14px
- Dashboard screenshots: Use browser at 1280×720 viewport
- Code screenshots: Use VS Code dark theme or GitHub dark theme
- All screenshots should have consistent padding (20px minimum)
- No sensitive data in screenshots
- Mock data is fine for demo purposes
