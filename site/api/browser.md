# Browser API

Headless Chromium browser sessions via Playwright.

## Create Session

```
POST /v1/browser/session
```

### Request

```json
{
  "headless": true,        // Optional. Default: true
  "width": 1280,           // Optional. Viewport width (default: 1280)
  "height": 720,           // Optional. Viewport height (default: 720)
  "ttlSeconds": 300        // Optional. Session TTL (default: 300)
}
```

### Response

```json
{
  "sessionId": "sess_abc123def456",
  "status": "created",
  "url": null,
  "width": 1280,
  "height": 720,
  "expiresAt": "2024-01-15T10:35:00Z"
}
```

## Get Session

```
GET /v1/browser/session/:id
```

```json
{
  "sessionId": "sess_abc123def456",
  "status": "active",
  "url": "https://example.com",
  "width": 1280,
  "height": 720,
  "expiresAt": "2024-01-15T10:35:00Z"
}
```

## Take Screenshot

```
POST /v1/browser/session/:id/screenshot
```

### Request

```json
{
  "url": "https://example.com"   // Optional. Navigate before screenshot
}
```

### Response

Returns PNG image binary (`Content-Type: image/png`).

## Close Session

```
DELETE /v1/browser/session/:id
```

```json
{
  "sessionId": "sess_abc123def456",
  "status": "closed"
}
```

## Examples

### Full Lifecycle

```bash
# Create
SESSION=$(curl -s -X POST http://localhost:8787/v1/browser/session \
  -H 'Content-Type: application/json' \
  -d '{"headless": true}' | jq -r '.sessionId')

# Navigate and screenshot
curl -X POST "http://localhost:8787/v1/browser/session/$SESSION/screenshot" \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com"}' \
  -o screenshot.png

# Check status
curl http://localhost:8787/v1/browser/session/$SESSION

# Close
curl -X DELETE "http://localhost:8787/v1/browser/session/$SESSION"
```

## Notes

- Sessions auto-expire after `ttlSeconds` (default: 300s)
- Max concurrent sessions: 2 (configurable via `MAX_BROWSER_SESSIONS`)
- Browser screenshots are stored in MinIO/S3, not in memory
- Sessions are isolated — each has its own browser context
