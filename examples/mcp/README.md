# MCP Configuration Examples

Example configuration files for integrating OpenFinch's MCP server with various AI coding tools.

## Files

| File | Tool |
|------|------|
| `claude_desktop_config.json` | Claude Desktop app |
| `claude_code_config.json` | Claude Code CLI |
| `cursor_mcp.json` | Cursor editor |
| `vscode_mcp.json` | VS Code (Cline, Continue) |

## Usage

### Claude Desktop
Copy the content from `claude_desktop_config.json` into your Claude Desktop MCP configuration file.

### Claude Code
```bash
claude mcp add openfinch -e npx -y openfinch-mcp
```

### VS Code (Cline/Roo Code)
Add the configuration from `vscode_mcp.json` to your MCP settings file.

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `openfinch_search` | Search the web via SearXNG |
| `openfinch_fetch` | Fetch URL as markdown |
| `openfinch_extract` | Extract structured data with LLM |
| `openfinch_browser_create_session` | Start a browser session |
| `openfinch_browser_screenshot` | Capture a screenshot |
| `openfinch_browser_close_session` | Close a browser session |
| `openfinch_agent_run` | Run an autonomous agent |
| `openfinch_agent_get_result` | Get agent run result |
| `openfinch_agent_get_events` | Get agent trace/events |

## Requirements

- OpenFinch API running at `http://localhost:8787`
- `openfinch-mcp` package published to npm or built locally
