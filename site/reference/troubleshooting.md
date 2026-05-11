# Troubleshooting

Common issues and solutions.

## Quick Diagnostics

```bash
# Run automated diagnostics
openfinch doctor

# Check API health
curl http://localhost:8787/health

# View API logs
docker compose logs -f api
```

## Docker Issues

### Docker Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
- **Windows:** Start Docker Desktop
- **macOS:** Start Docker Desktop
- **Linux:** `sudo systemctl start docker`
- Verify: `docker info`

### Port Already in Use

**Error:** `port is already allocated`

```bash
# Check port
netstat -ano | findstr :8787  # Windows
lsof -i :8787                  # macOS/Linux

# Change ports in .env:
API_PORT=8788
DOCKER_PORT=2375
```

## API Issues

### Health Check Fails

```bash
curl http://localhost:8787/health
```

If this fails: Is the API running? Check `docker compose ps api`.

### Search Returns Empty Results

- Is SearXNG running? `docker compose ps searxng`
- Check: `curl http://localhost:8080/health`
- Logs: `docker compose logs searxng`

### Fetch Returns 502

- The target site may be blocking requests
- Try with a different User-Agent
- The target site may require JavaScript rendering (`renderJs: true`)
- The target site may be down

### Extract Fails

- Check LLM API key is set in `.env`
- Verify the provider is supported
- Check API key has sufficient credits/quota

## CLI Issues

### openfinch Command Not Found

```bash
npx @openfinch/cli health     # via npx
node packages/cli/dist/cli.js  # from project
```

### doctor Shows Failures

- **API unreachable:** Ensure Docker Compose is running
- **Redis/Postgres not ready:** Wait for services to initialize
- **SearXNG unavailable:** Check searxng logs
- **No LLM providers:** Set at least one API key in `.env`

## Windows-Specific

### PowerShell curl Aliases

PowerShell has a native `curl` alias. Use the full path:

```powershell
curl.exe http://localhost:8787/health
# Or use Invoke-RestMethod
Invoke-RestMethod http://localhost:8787/health
# Or use the CLI
npx @openfinch/cli health
```

### WSL Networking

```bash
# Use host.docker.internal for Ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

## Service Connectivity

### Ollama

```bash
curl http://localhost:11434/api/tags
ollama pull llama3.2
```

### SearXNG

```bash
docker compose ps searxng
docker compose logs searxng
# SearXNG takes 10-30s to initialize on first run
```

### Redis

```bash
docker compose exec redis redis-cli ping
# Expected: PONG
```

### Postgres

```bash
docker compose exec postgres pg_isready -U openfinch
# Expected: accepting connections
```

## Getting Help

- Run `openfinch doctor` for automated diagnostics
- Check Docker logs: `docker compose logs -f`
- Enable debug logging: `LOG_LEVEL=debug` in `.env`
- Open a [GitHub issue](https://github.com/JonusNattapong/OpenFinch/issues) with `doctor` output and logs
