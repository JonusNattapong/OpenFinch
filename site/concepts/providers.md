# LLM Providers

OpenFinch supports multiple LLM providers. Configure one or more via environment variables.

## Supported Providers

| Provider | Env Variable | Default Model |
|----------|-------------|---------------|
| OpenAI | `OPENAI_API_KEY` | gpt-4o |
| Anthropic | `ANTHROPIC_API_KEY` | claude-sonnet-4-20250514 |
| Gemini | `GEMINI_API_KEY` | gemini-2.0-flash |
| OpenRouter | `OPENROUTER_API_KEY` | gpt-4o |
| Ollama (local) | `OLLAMA_BASE_URL` | llama3.2 |
| OpenAI-compatible | `OPENAI_COMPATIBLE_BASE_URL` | configurable |

## Auto-Selection Priority

When no provider is specified in a request, OpenFinch selects in this order:

1. OpenAI (if `OPENAI_API_KEY` is set)
2. Anthropic (if `ANTHROPIC_API_KEY` is set)
3. OpenRouter (if `OPENROUTER_API_KEY` is set)
4. Gemini (if `GEMINI_API_KEY` is set)
5. Ollama (if `OLLAMA_BASE_URL` is set)
6. OpenAI-compatible (if `OPENAI_COMPATIBLE_BASE_URL` is set)

## Per-Request Override

Specify provider and model in each request:

```bash
curl -X POST http://localhost:8787/v1/extract \
  -H 'Content-Type: application/json' \
  -d '{"url": "...", "prompt": "...", "provider": "anthropic", "model": "claude-sonnet-4-20250514"}'
```

## Ollama Setup

Local models via Ollama — no API costs, runs on your machine.

### 1. Install Ollama

Download from [ollama.com](https://ollama.com) and install.

### 2. Pull a Model

```bash
ollama pull llama3.2
ollama pull codellama
ollama pull mistral
```

### 3. Configure

```bash
# .env
OLLAMA_BASE_URL=http://localhost:11434
```

For Docker Compose (reach host Ollama):

```bash
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

## Model Recommendations

| Task | Recommended Model |
|------|-------------------|
| Simple extraction | `gpt-4o-mini`, `claude-haiku-4-20250514`, `llama3.2` |
| Complex extraction | `gpt-4o`, `claude-sonnet-4-20250514` |
| Agent reasoning | `gpt-4o`, `claude-sonnet-4-20250514` |
| Code-heavy tasks | `codellama`, `claude-sonnet-4-20250514` |

## Cost Warning

API-based providers (OpenAI, Anthropic, OpenRouter, Gemini) charge per-token. Monitor your usage:

- Extract: 1,000–10,000 tokens per page
- Agent: 10,000–100,000 tokens per run

Use Ollama for development and testing to avoid costs.

## Listing Available Providers

```bash
curl http://localhost:8787/v1/agent/providers
# {"providers":["openai","anthropic","ollama"]}
```
