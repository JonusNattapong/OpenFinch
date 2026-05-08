# Troubleshooting

Common issues and solutions for OpenFinch.

## Docker Issues

### Docker Not Running

**Error:** `Cannot connect to the Docker daemon`
**Solution:**
- **Windows:** Start Docker Desktop from the Start menu
- **macOS:** Start Docker Desktop from Applications
- **Linux:** `sudo systemctl start docker`
- Verify: `docker info`

### Docker Compose Not Found

**Error:** `docker compose: command not found`
**Solution:**
- Install Docker Desktop (includes compose)
- Or install docker-compose plugin separately
- Some systems use `docker-compose` (with hyphen) instead of `docker compose`

### Port Already in Use

**Error:** `port is already allocated` or `EADDRINUSE`
**Solution:**
```bash
# Check what's using the port (e.g., 8787)
netstat -ano | findstr :8787  # Windows
lsof -i :8787                  # macOS/Linux

# Change ports in .env:
API_PORT=8788
DASHBOARD_PORT=3001
```

### Docker Compose Services Won't Start

Run with verbose output:
```bash
docker compose up -d
docker compose logs api
docker compose ps
# Check individual service logs
docker compose logs redis
docker compose logs postgres
```

## pnpm / Build Issues

### pnpm Install Fails

**Error:** Various install errors
**Solution:**
```bash
# Clear pnpm cache
pnpm store prune
rm -rf node_modules
pnpm install

# Check Node.js version (need 22+)
node --version

# Check pnpm version (need 10+)
pnpm --version
```

### Build Fails

**Error:** TypeScript compilation errors
**Solution:**
```bash
# Check for type errors
pnpm -r lint

# Clean and rebuild
pnpm clean
pnpm build
```

### Playwright Browser Install Fails

**Error:** `Can not find Playwright browser`
**Solution:**
```bash
# Inside the browser-worker container
docker compose exec browser-worker npx playwright install chromium

# Or for local dev
npx playwright install chromium
```

## API Issues

### Health Check Fails

```bash
curl http://localhost:8787/health
```

If this fails:
- Is the API running? Check `docker compose ps api`
- Is the port correct? Check `API_PORT` in `.env`
- Run `openfinch doctor` for diagnostics

### Search Returns Empty Results

```bash
curl -X POST http://localhost:8787/v1/search \
  -H 'Content-Type: application/json' \
  -d '{"query": "test"}'
```

If results are empty:
- Is SearXNG running? `docker compose ps searxng`
- Check SearXNG health: `curl http://localhost:8080/health`
- Check logs: `docker compose logs searxng`

### Fetch Returns 502

**Error:** HTTP 502 Bad Gateway
**Solution:**
- The target site may be blocking the request
- Try with a different User-Agent
- Some sites require JavaScript rendering
- The target site may be down

### Extract Fails

**Error:** LLM provider errors
**Solution:**
- Check LLM API key is set in `.env`
- Verify the provider is supported
- Check API key has sufficient credits/quota
- Try a different model

## CLI Issues

### openfinch Command Not Found

**Solution:**
```bash
# If installed globally
npx openfinch health

# Or from the project directory
node packages/cli/dist/cli.js health
```

### openfinch doctor Shows Failures

Common failures and fixes:
- **API unreachable:** Ensure Docker Compose is running
- **Redis/Postgres not ready:** Wait for services to initialize
- **SearXNG unavailable:** Check searxng service logs
- **No LLM providers:** Set at least one API key in `.env`
- **Browser sessions:** Ensure browser-worker is running

## Windows-Specific Issues

### PowerShell curl Aliases

PowerShell has a native `curl` alias that maps to `Invoke-WebRequest`, not the real curl.

**Use instead:**
```powershell
# Use full path to curl
curl.exe http://localhost:8787/health

# Or use the CLI
npx openfinch health

# Or use PowerShell's native cmdlet
Invoke-RestMethod http://localhost:8787/health
```

### WSL Networking

If running OpenFinch in WSL2:

```bash
# Check WSL network
ip addr show eth0

# Docker Desktop must have WSL integration enabled
# In Docker Desktop Settings → Resources → WSL Integration

# Access host services from WSL
# Use localhost (WSL2 shares the Windows host network)
curl http://localhost:8787/health

# If using Ollama on Windows, from WSL use:
# OLLAMA_BASE_URL=http://host.docker.internal:11434
```

### Long Path Issues on Windows

**Error:** Path too long
**Solution:**
```bash
# Enable long paths in Git
git config --system core.longpaths true

# Or clone to a shorter path
```

## Service-Specific Issues

### Ollama Connection Issues

```bash
# Test Ollama is running
curl http://localhost:11434/api/tags

# Common issues:
# - Ollama not running: Start Ollama app
# - Wrong URL: Use host.docker.internal in Docker, localhost for native
# - Model not pulled: ollama pull llama3.2
```

### SearXNG Not Available

```bash
# Check SearXNG status
docker compose ps searxng
docker compose logs searxng

# Common issues:
# - SearXNG takes time to initialize on first run
# - Port 8080 may be in use
# - Check SEARXNG_URL in .env matches docker-compose.yml
```

### Redis Connection Issues

```bash
# Test Redis connectivity
docker compose exec redis redis-cli ping
# Should respond: PONG

# Common issues:
# - Redis not started: docker compose up -d redis
# - Wrong URL: Check REDIS_URL in .env
```

### Postgres Connection Issues

```bash
# Test Postgres connectivity
docker compose exec postgres pg_isready -U openfinch
# Should respond: accepting connections

# Common issues:
# - Postgres takes time to initialize on first run
# - Check DATABASE_URL in .env
```

### Browser Worker Memory Issues

**Symptom:** Browser sessions are slow or crash
**Solutions:**
- Reduce `MAX_BROWSER_SESSIONS` in `.env` (default: 2)
- Increase Docker memory limit in Docker Desktop settings
- Close unused browser sessions
- Monitor memory: `docker compose stats`

## Getting More Help

- Run `openfinch doctor` for automated diagnostics
- Check Docker logs: `docker compose logs -f`
- Enable debug logging: `LOG_LEVEL=debug` in `.env`
- Open a GitHub issue with:
  - `openfinch doctor` output
  - Docker compose logs
  - Steps to reproduce
