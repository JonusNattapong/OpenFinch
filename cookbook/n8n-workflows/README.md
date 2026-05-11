# n8n Workflow Templates

n8n workflow templates for integrating OpenFinch into automation pipelines.

## TODO: Importable Workflows

Coming soon. These workflows will be exportable `.json` files that can be
imported directly into n8n.

### Planned Workflows

1. **Monitor Product Prices** — Periodically fetch and extract prices from a URL
2. **Daily Research Brief** — Search + fetch top results + extract key info → email
3. **Browser Screenshot Alert** — Take screenshot on schedule, save to storage

### Setup

1. Install n8n: `npx n8n`
2. Import workflow JSON
3. Configure OpenFinch API URL and credentials
4. Activate workflow

For now, use the HTTP Request node to call OpenFinch API endpoints directly:

```json
{
  "url": "http://localhost:8787/v1/fetch",
  "method": "POST",
  "headers": { "Content-Type": "application/json" },
  "body": "{\"url\":\"={{$json.url}}\",\"format\":\"markdown\"}"
}
```
