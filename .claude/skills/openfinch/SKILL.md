---
name: openfinch
description: Self-hosted AI web agent with search, fetch, extract, and browser automation. Use when user asks to research topics, find information, extract data from websites, take screenshots, or automate web browsing tasks.
version: 0.1.0
author: OpenFinch
homepage: https://github.com/JonusNattapong/OpenFinch
triggers:
  - "research"
  - "search the web"
  - "find information"
  - "extract data from"
  - "scrape"
  - "take a screenshot of"
  - "browse to"
  - "go to"
  - "navigate to"
  - "extract pricing"
  - "extract product"
  - "extract information from"
  - "summarize the page"
  - "automate web"
  - "web agent"
---

# OpenFinch — Web Agent Skill

OpenFinch is a self-hosted AI web agent infrastructure available as an MCP server. Use these tools when the task involves web research, data extraction, or browser automation.

## Available Tools

| Tool | Use For |
|------|---------|
| `openfinch_search` | Web search when you don't have a URL |
| `openfinch_fetch` | Get page content as markdown |
| `openfinch_extract` | Structured data extraction with LLM |
| `openfinch_browser_create_session` | Start browser for JS-heavy pages |
| `openfinch_browser_screenshot` | Take screenshot |
| `openfinch_browser_close_session` | Clean up browser session |
| `openfinch_agent_run` | Autonomous agent for multi-step tasks |
| `openfinch_agent_get_result` | Get agent result |
| `openfinch_agent_get_events` | Get agent event trace |

## Quick Start

### Before using, ensure OpenFinch is running:

```bash
# One-line deploy
curl -fsSL https://raw.githubusercontent.com/JonusNattapong/OpenFinch/main/deploy.sh | bash

# Or manual
git clone https://github.com/JonusNattapong/OpenFinch.git
cd OpenFinch && cp .env.example .env
# Edit .env and set LLM keys
docker compose up -d
```

### Configure in Claude Code (`~/.claude/settings.local.json`):

```json
{
  "mcpServers": {
    "openfinch": {
      "command": "npx",
      "args": ["-y", "@openfinch/mcp-server"],
      "env": {
        "OPENFINCH_API_URL": "http://localhost:8787"
      }
    }
  }
}
```

## Usage Patterns

### 1. Simple Search
```
Search for information: use openfinch_search with query
```

### 2. Fetch Page Content
```
Get page content: use openfinch_fetch with url and format="markdown"
```

### 3. Extract Structured Data
```
Extract data: use openfinch_extract with url and prompt describing what to extract
```

### 4. Browser Automation
```
1. Create session: openfinch_browser_create_session
2. Navigate: use openfinch_fetch with the URL (or agent_run for complex tasks)
3. Screenshot: openfinch_browser_screenshot with sessionId
4. Close: openfinch_browser_close_session
```

### 5. Multi-Step Agent Task
```
1. Start agent: openfinch_agent_run with goal (and optional startUrl)
2. Poll for result: openfinch_agent_get_result with runId
3. Get full trace: openfinch_agent_get_events with runId
```

## Safety

- **Destructive actions blocked**: delete, purchase, submit payment, send messages require explicit user confirmation
- **Allowed domains**: respect `allowedDomains` if specified
- **robots.txt**: respected by default
- **No credentials**: never enter passwords or secrets unless user explicitly provides them

## Examples

**Research a topic:**
→ `openfinch_search` → `openfinch_fetch` → `openfinch_extract`

**Get structured data:**
→ `openfinch_extract` with prompt describing the schema

**Multi-page research:**
→ `openfinch_agent_run` with goal describing the full task

**Screenshot a page:**
→ `openfinch_browser_create_session` → `openfinch_browser_screenshot` → `openfinch_browser_close_session`
