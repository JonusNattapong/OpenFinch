# Search API

Search the web via SearXNG — no external API keys required.

## Endpoint

```
POST /v1/search
```

## Request

```json
{
  "query": "string",        // Required. Search query (1-500 chars)
  "limit": 10,              // Optional. Results to return (1-50, default: 10)
  "language": "en",          // Optional. ISO language code
  "region": "us"            // Optional. SearXNG region code
}
```

## Response

```json
{
  "query": "latest AI news",
  "results": [
    {
      "title": "Article Title",
      "url": "https://example.com/article",
      "snippet": "Brief description of the article...",
      "source": "example.com",
      "published": "2024-01-15T10:30:00Z"
    }
  ],
  "cached": true,
  "count": 10
}
```

## Examples

### cURL

```bash
curl -X POST http://localhost:8787/v1/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "web automation tools 2024", "limit": 5}'
```

### JavaScript

```javascript
const res = await fetch("http://localhost:8787/v1/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "web automation tools 2024", limit: 5 }),
});
const data = await res.json();
console.log(data.results);
```

## Notes

- Results are normalized from multiple search engines via SearXNG
- Results are cached for 10 minutes
- Set `language` to restrict results to a specific language
- The `source` field shows the domain of each result
