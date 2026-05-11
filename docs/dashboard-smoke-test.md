# Dashboard Smoke Test (Manual)

Manual verification checklist for the OpenFinch web dashboard.

## Prerequisites

- OpenFinch running: `docker compose up -d`
- Dashboard enabled: `docker compose --profile full up -d` (or run standalone)
- Dashboard URL: http://localhost:3000

## Checklist

### 1. Dashboard Loads

- [ ] Navigate to http://localhost:3000
- [ ] Page loads without errors (check browser console for 404s or JS errors)
- [ ] Loading states appear briefly then resolve
- [ ] No "Connection refused" or "API unreachable" errors

### 2. System Status / Overview

- [ ] Health status indicator shows green/OK
- [ ] API version displayed (should be 0.1.0)
- [ ] Uptime shown
- [ ] Worker statuses visible (search, fetch, browser, agent)

### 3. Search Playground

- [ ] Search input field is present
- [ ] Enter a query like "openfinch" and submit
- [ ] Results display with title, URL, snippet
- [ ] Loading indicator appears during search
- [ ] Error state shown gracefully if SearXNG is unavailable

### 4. Fetch Playground

- [ ] URL input field is present
- [ ] Format selector (markdown/text/html) available
- [ ] Enter `http://localhost:4173/` (requires demo site running)
- [ ] Content renders as formatted text
- [ ] Metadata (title, URL) displayed
- [ ] Error state handled for invalid URLs

### 5. Extract Playground

- [ ] URL input field is present
- [ ] Prompt input field is present
- [ ] Schema input (JSON) field available
- [ ] Provider selector shows configured providers
- [ ] Enter test URL + prompt (requires LLM provider)
- [ ] Result displays as formatted JSON
- [ ] Loading indicator during extraction
- [ ] Cache indicator shown on repeat extraction

### 6. Browser Sessions Page

- [ ] Session list shows active sessions (or empty state)
- [ ] "Create Session" button works
- [ ] Session detail shows ID, status, created time
- [ ] Screenshot button captures and displays preview
- [ ] Close button terminates session
- [ ] Auto-expiry info displayed

### 7. Agent Runs Page

- [ ] Run list shows recent runs (or empty state)
- [ ] "New Run" form with goal, provider, max steps inputs
- [ ] Run detail shows status, progress, and error info
- [ ] Events/trace viewer shows agent steps
- [ ] Result viewer shows final output
- [ ] Polling updates status in real-time

### 8. Provider Configuration

- [ ] Provider list shows configured providers
- [ ] Each provider shows name and model
- [ ] Unconfigured providers show "not configured" state

### 9. Responsive Design

- [ ] Dashboard renders correctly at 1920×1080
- [ ] Dashboard renders correctly at 1280×720
- [ ] Dashboard renders correctly at 375×667 (mobile)
- [ ] Navigation is usable on all screen sizes

### 10. Error States

- [ ] Dashboard shows friendly error when API is down
- [ ] Retry/reconnect button appears when connection lost
- [ ] Console has no uncaught exceptions
- [ ] 404 pages show helpful message

## Notes

- The dashboard requires `--profile full` in Docker Compose
- If running the dashboard standalone, set `API_URL=http://localhost:8787`
- Browser developer console may show API request errors — these are expected if services are not running
