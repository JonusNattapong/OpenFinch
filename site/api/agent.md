# Agent API

Autonomous web agent with a real observe → decide → act loop.

## Create Run

```
POST /v1/agent/run
```

### Request

```json
{
  "goal": "Go to example.com and extract the main heading",  // Required
  "startUrl": "https://example.com",                         // Optional
  "maxSteps": 20,                                            // Optional (default: 20)
  "maxRuntimeSeconds": 180,                                  // Optional (default: 180)
  "allowedDomains": ["example.com"],                          // Optional
  "provider": "openai",                                      // Optional
  "model": "gpt-4o"                                         // Optional
}
```

### Response

```json
{
  "runId": "run_abc123def456",
  "goal": "Go to example.com and extract the main heading",
  "status": "queued",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Get Run Status

```
GET /v1/agent/run/:id
```

```json
{
  "runId": "run_abc123def456",
  "goal": "Go to example.com and extract the main heading",
  "status": "running",
  "currentStep": 3,
  "maxSteps": 20,
  "result": null,
  "error": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "startedAt": "2024-01-15T10:30:01Z"
}
```

### Run Statuses

| Status | Description |
|--------|-------------|
| `queued` | Waiting in BullMQ queue |
| `running` | Agent is actively executing |
| `completed` | Finished successfully |
| `failed` | Agent encountered an error |
| `cancelled` | Cancelled via API |
| `timed_out` | Exceeded max runtime |

## Get Result

```
GET /v1/agent/run/:id/result
```

```json
{
  "runId": "run_abc123def456",
  "status": "completed",
  "result": {
    "answer": "The main heading is 'Example Domain'.",
    "steps": 3
  },
  "error": null,
  "completedAt": "2024-01-15T10:30:45Z"
}
```

## Get Event Trace

```
GET /v1/agent/run/:id/events
```

Returns a stream of agent events (SSE or JSON array) showing every decision:

```json
[
  {
    "id": "evt_001",
    "step": 1,
    "type": "run_started",
    "data": { "url": "https://example.com" },
    "createdAt": "2024-01-15T10:30:01Z"
  },
  {
    "id": "evt_002",
    "step": 1,
    "type": "observation",
    "data": { "url": "https://example.com", "title": "Example Domain", "text": "..." },
    "createdAt": "2024-01-15T10:30:02Z"
  },
  {
    "id": "evt_003",
    "step": 1,
    "type": "llm_decision",
    "data": { "reasoningSummary": "The page loaded successfully...", "action": { "type": "extract", "prompt": "..." } },
    "createdAt": "2024-01-15T10:30:03Z"
  },
  {
    "id": "evt_004",
    "step": 1,
    "type": "action_executed",
    "data": { "type": "extract", "result": "Example Domain" },
    "createdAt": "2024-01-15T10:30:04Z"
  },
  {
    "id": "evt_005",
    "step": 1,
    "type": "run_completed",
    "data": { "answer": "The main heading is 'Example Domain'." },
    "createdAt": "2024-01-15T10:30:05Z"
  }
]
```

## Cancel Run

```
POST /v1/agent/run/:id/cancel
```

```json
{
  "runId": "run_abc123def456",
  "status": "cancelled"
}
```

## Supported Actions

The agent can perform these actions:

| Action | Description |
|--------|-------------|
| `goto` | Navigate to a URL |
| `click` | Click an element by CSS selector |
| `type` | Type text into an input field |
| `scroll` | Scroll up/down by amount |
| `wait` | Wait for a duration or selector |
| `screenshot` | Capture current page as screenshot |
| `extract` | Extract data using LLM |
| `finish` | Complete with final answer |
| `fail` | End with error message |

## Examples

### Start and Poll

```bash
# Start run
RUN=$(curl -s -X POST http://localhost:8787/v1/agent/run \
  -H 'Content-Type: application/json' \
  -d '{"goal": "Go to example.com and extract the main heading", "startUrl": "https://example.com"}' \
  | jq -r '.runId')

# Poll for completion
while true; do
  STATUS=$(curl -s "http://localhost:8787/v1/agent/run/$RUN/result" | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    curl -s "http://localhost:8787/v1/agent/run/$RUN/result" | jq
    break
  fi
  sleep 2
done
```

### View Full Trace

```bash
curl http://localhost:8787/v1/agent/run/$RUN/events | jq
```

## Notes

- Each step is stored as an event in Postgres for full replayability
- Screenshots are stored as artifacts in MinIO
- Agent uses Playwright for real browser automation
- Loop detection prevents infinite repetition of the same action
- URL validation blocks javascript:, data:, and file: protocols
