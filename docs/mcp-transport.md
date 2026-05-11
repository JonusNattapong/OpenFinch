# MCP Transport

OpenFinch MCP server transport modes.

## Current Status (v0.1.0)

| Transport | Supported | Notes |
|-----------|-----------|-------|
| **STDIO** | ✅ Yes | Default. Used by Claude Desktop, Claude Code, Cursor, VS Code. |
| **HTTP/SSE** | ❌ Not yet | Planned for future releases. |

## STDIO (Default)

The MCP server uses stdio transport by default. The server process communicates with the AI tool (Claude Desktop, Cursor, etc.) via standard input/output.

### Claude Desktop

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

### Claude Code CLI

```bash
claude mcp add openfinch -e npx -y openfinch-mcp \
  -e OPENFINCH_API_URL=http://localhost:8787
```

### Cursor

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

### VS Code (Cline / Roo Code / Continue)

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

## Available Tools

| Tool | Description | Requires |
|------|-------------|----------|
| `openfinch_search` | Search the web via SearXNG | SearXNG running |
| `openfinch_fetch` | Fetch URL as markdown | Internet access |
| `openfinch_extract` | Extract structured data with LLM | LLM provider configured |
| `openfinch_browser_create_session` | Start a browser session | Browser worker |
| `openfinch_browser_screenshot` | Capture a screenshot | Active browser session |
| `openfinch_browser_close_session` | Close a browser session | Active browser session |
| `openfinch_agent_run` | Run an autonomous agent | LLM provider configured |
| `openfinch_agent_get_result` | Get agent run result | Active agent run |
| `openfinch_agent_get_events` | Get agent trace/events | Active agent run |

## HTTP/SSE (Planned)

HTTP/SSE transport is planned for a future release. This will allow:

- Remote MCP connections over HTTP
- SSE (Server-Sent Events) for streaming tool results
- Direct integration without requiring the MCP server as a local process

## Debugging MCP Connections

### Server starts but tools not found

1. Verify OpenFinch API is running:
   ```bash
   curl http://localhost:8787/health
   ```

2. Run MCP server directly to check for errors:
   ```bash
   npx openfinch-mcp
   # Or locally:
   node services/mcp-server/dist/index.js
   ```

3. Check Claude Desktop MCP logs:
   - macOS: `~/Library/Logs/Claude/mcp*.log`
   - Windows: `%APPDATA%\Claude\logs\mcp*.log`

4. Verify the server version:
   ```bash
   npx openfinch-mcp --version
   ```

### Connection refused

```
Error: connect ECONNREFUSED 127.0.0.1:8787
```

Fix: Start Docker Compose: `docker compose up -d`

### Tool returns errors

Most tools require the OpenFinch API to be running. If tools return errors:

1. Check API health: `curl http://localhost:8787/health`
2. Check LLM provider configuration: `curl http://localhost:8787/v1/agent/providers`
3. Run diagnostics: `npx @openfinch/cli doctor`

## Testing MCP Locally

```bash
# Run MCP server in debug mode
node services/mcp-server/dist/index.js

# In another terminal, test with a JSON-RPC request:
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  node services/mcp-server/dist/index.js

# Expected output includes tool definitions for all 9 OpenFinch tools
```
