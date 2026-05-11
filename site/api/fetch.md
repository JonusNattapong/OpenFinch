# Fetch API

Convert any URL to clean markdown or HTML.

## Endpoint

```
POST /v1/fetch
```

## Request

```json
{
  "url": "https://example.com",   // Required. URL to fetch
  "format": "markdown",           // Optional. "markdown" (default) or "html"
  "renderJs": "auto",             // Optional. "auto" (default) or true/false
  "timeout": 30000               // Optional. Timeout in ms (default: 30000)
}
```

### `renderJs`

- `"auto"` — Use Playwright if initial fetch fails or page is SPA
- `true` — Always use Playwright (slower, for JavaScript-rendered pages)
- `false` — HTTP fetch only (faster, works for static pages)

## Response

```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "content": "# Example Domain\n\nThis domain is...",
  "format": "markdown",
  "statusCode": 200,
  "contentType": "text/html",
  "fetchedAt": "2024-01-15T10:30:00Z",
  "cached": false
}
```

## Examples

### Basic Fetch

```bash
curl -X POST http://localhost:8787/v1/fetch \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com"}'
```

### HTML Format

```bash
curl -X POST http://localhost:8787/v1/fetch \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com", "format": "html"}'
```

### Force JavaScript Rendering

```bash
curl -X POST http://localhost:8787/v1/fetch \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com/ssr-page", "renderJs": true}'
```

## Notes

- Results are cached for 1 hour
- robots.txt is respected by default
- Large pages are truncated to ~1MB of markdown
- Images and non-text content are not included in markdown output
