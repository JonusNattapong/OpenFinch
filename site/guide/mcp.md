# MCP Server

OpenFinch includes an MCP (Model Context Protocol) server for connecting to AI tools like Claude Desktop, Cursor, VS Code, and Windsurf.

## Setup

### Claude Desktop

Add to `claude_desktop_config.json`:

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

### Claude Code CLI

```bash
claude mcp add openfinch \
  -e npx \
  -e -y \
  -e @openfinch/mcp-server \
  -e OPENFINCH_API_URL=http://localhost:8787
```

### Cursor

Add to Cursor settings → MCP Servers:

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

### VS Code (Cline / Roo Code / Continue)

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

## Available Tools

| Tool | Description | When to Use |
|------|-------------|-------------|
| `openfinch_search` | Web search via SearXNG | When you don't have a URL |
| `openfinch_fetch` | Fetch URL as markdown | Get page content quickly |
| `openfinch_extract` | LLM-powered extraction | Extract structured data |
| `openfinch_browser_create_session` | Start browser | For JS-heavy pages |
| `openfinch_browser_screenshot` | Take screenshot | Visual verification |
| `openfinch_browser_close_session` | Close browser | Clean up resources |
| `openfinch_agent_run` | Run autonomous agent | Multi-step tasks |
| `openfinch_agent_get_result` | Get agent result | After agent completes |
| `openfinch_agent_get_events` | Get event trace | Debug agent decisions |

## Usage Example

When Claude (or any connected AI) needs to research a topic:

```
User: Can you find the latest pricing for AWS Lambda?

Claude → openfinch_search("AWS Lambda pricing 2024")
Claude → openfinch_fetch("https://aws.amazon.com/lambda/pricing/")
Claude → openfinch_extract(..., "Extract the pricing tiers")
Claude → Summarizes the pricing to the user
```

## Troubleshooting

### Server starts but tools not found

1. Verify API is running:
   ```bash
   curl http://localhost:8787/health
   ```

2. Run MCP server directly:
   ```bash
   npx @openfinch/mcp-server
   ```

3. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/mcp*.log`
   - Windows: `%APPDATA%\Claude\logs\mcp*.log`

### Connection refused

```
Error: connect ECONNREFUSED 127.0.0.1:8787
```

Fix: Start Docker Compose `docker compose up -d`

### Tool returns errors

Most tools require the OpenFinch API and at least one LLM provider configured.

## Safety

The MCP server inherits OpenFinch's safety features:
- robots.txt respected by default
- Domain rate limiting (30 req/min per domain)
- Destructive actions blocked (delete, purchase, submit)
- No credentials entered unless explicitly provided
