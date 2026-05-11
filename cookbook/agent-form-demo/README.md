# Agent Form Demo Recipe

Demonstrates an autonomous agent navigating to a form page and filling it out.

## Prerequisites

- OpenFinch API running (`docker compose up -d`)
- Demo site running (`pnpm demo:site`)
- LLM provider configured (Ollama recommended)
- Browser worker running (part of Docker Compose)

## Usage

```bash
export OPENFINCH_API_URL=http://localhost:8787
export DEMO_SITE_URL=http://localhost:4173
export LLM_PROVIDER=ollama

node cookbook/agent-form-demo/index.js
```

## Expected Output

```
=== Agent Form Demo ===

Goal: Navigate to http://localhost:4173/form and fill out the contact form

Creating agent run...
Run created: uuid-here
Status: queued

Polling for results (max 60s)...
   Status: succeeded (step 8/10)

Final status: succeeded

Agent trace (15 events):
  [run_created] step 0
  [browser_started] step 1
  [page_loaded] step 2
  [action_completed] step 5
  [run_succeeded] step 8
```
