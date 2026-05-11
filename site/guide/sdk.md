# SDK

OpenFinch provides official JavaScript and Python SDKs for integrating into your applications.

## JavaScript / TypeScript

### Installation

```bash
npm install openfinch
```

### Setup

```javascript
import { OpenFinch } from "openfinch";

const client = new OpenFinch({
  baseUrl: "http://localhost:8787",
});
```

### Search

```javascript
const results = await client.search({
  query: "AI news",
  limit: 5,
  language: "en",
});

// results.results[0].title, .url, .snippet
```

### Fetch

```javascript
const page = await client.fetch({
  url: "https://example.com",
  format: "markdown", // or "html"
});

// page.content — markdown or HTML string
// page.title — page title
```

### Extract

```javascript
const data = await client.extract({
  url: "https://example.com/products",
  prompt: "Extract all product names and prices",
  provider: "openai", // optional — auto-selects
});

// data — structured JSON matching your prompt
```

### Browser

```javascript
// Create a session
const { sessionId } = await client.browser.createSession({
  headless: true,
  width: 1280,
  height: 720,
});

// Take screenshot
const screenshot = await client.browser.screenshot(sessionId);

// Close session
await client.browser.close(sessionId);
```

### Agent

```javascript
// Start a run
const run = await client.agent.run({
  goal: "Go to example.com and extract the main heading",
  startUrl: "https://example.com",
  maxSteps: 10,
});

// Poll for result
let result;
while (true) {
  result = await client.agent.result(run.runId);
  if (result.status === "completed" || result.status === "failed") break;
  await new Promise(r => setTimeout(r, 2000));
}

// Get event trace
const events = await client.agent.events(run.runId);
```

---

## Python

### Installation

```bash
pip install openfinch
```

### Setup

```python
from openfinch import OpenFinch

client = OpenFinch(base_url="http://localhost:8787")
```

### Search

```python
results = client.search(query="AI news", limit=5)
for r in results["results"]:
    print(r["title"], r["url"])
```

### Fetch

```python
page = client.fetch(url="https://example.com")
print(page["content"])
```

### Extract

```python
data = client.extract(
    url="https://example.com/products",
    prompt="Extract all product names and prices"
)
```

### Browser

```python
session = client.browser.create_session()
screenshot = client.browser.screenshot(session["sessionId"])
client.browser.close(session["sessionId"])
```

### Agent

```python
run = client.agent.run(
    goal="Go to example.com and extract the main heading",
    startUrl="https://example.com"
)

import time
while True:
    result = client.agent.result(run["runId"])
    if result["status"] in ("completed", "failed"):
        print(result["result"])
        break
    time.sleep(2)
```

---

## Error Handling

```javascript
try {
  const data = await client.extract({ url: "https://example.com", prompt: "..." });
} catch (err) {
  if (err.code === "RATE_LIMITED") {
    console.error("Rate limited — wait before retrying");
  } else if (err.code === "LLM_ERROR") {
    console.error("LLM provider error:", err.message);
  } else {
    throw err;
  }
}
```

## TypeScript Types

All responses are fully typed. Import types from `@openfinch/schemas`:

```typescript
import type { SearchResponse, FetchResponse, ExtractResponse, AgentRunResponse } from "@openfinch/schemas";
```
