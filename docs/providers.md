# LLM Provider Setup

OpenFinch supports multiple LLM providers. Configure them via environment variables.

## Supported Providers

| Provider | Env Variable | Default Model |
|----------|-------------|---------------|
| OpenAI | `OPENAI_API_KEY` | gpt-4o |
| Anthropic | `ANTHROPIC_API_KEY` | claude-sonnet-4-20250514 |
| Gemini | `GEMINI_API_KEY` | gemini-2.0-flash |
| OpenRouter | `OPENROUTER_API_KEY` | gpt-4o |
| Ollama (local) | `OLLAMA_BASE_URL` | llama3.2 |

## Provider Priority

When no provider is specified in a request, OpenFinch auto-selects in this order:
1. OpenAI
2. Anthropic
3. OpenRouter
4. Gemini
5. Ollama

## Ollama Setup

1. Install [Ollama](https://ollama.com)
2. Pull a model: `ollama pull llama3.2`
3. Set env: `OLLAMA_BASE_URL=http://host.docker.internal:11434`

For Docker Compose, use `host.docker.internal` to reach the host's Ollama instance.

## Cost Warning

API-based providers (OpenAI, Anthropic, OpenRouter) charge per-token. The Extract and Agent APIs can consume significant tokens. Monitor your usage.
