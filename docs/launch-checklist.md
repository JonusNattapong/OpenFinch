# Launch Checklist

Pre-flight checklist before publishing a new release of OpenFinch.

## Pre-Release

### Code Quality
- [ ] `pnpm install` succeeds with frozen lockfile
- [ ] `pnpm -r build` succeeds (all packages compile)
- [ ] `pnpm -r test` passes (all tests green)
- [ ] `pnpm -r lint` passes (no type errors)
- [ ] `pnpm format` passes (code style consistent)
- [ ] CHANGELOG.md updated with release notes
- [ ] Version bumped in package.json files

### Docker
- [ ] `docker compose -f infra/docker-compose.yml config` validates
- [ ] `docker compose up --build -d` starts all services
- [ ] All service healthchecks pass (postgres, redis, searxng, minio)

### Docker Publishing (Future)
```bash
# Build all images with OCI labels
docker compose -f infra/docker-compose.yml build

# Tag with registry prefix when ready
docker tag openfinch/api:0.1.0 docker.io/openfinch/api:0.1.0
docker tag openfinch/api:0.1.0 docker.io/openfinch/api:latest

# Push individual images
docker push docker.io/openfinch/api:0.1.0
docker push docker.io/openfinch/api:latest

# Or push all at once (requires docker compose push support)
docker compose -f infra/docker-compose.yml push
```

- [ ] `DOCKER_TOKEN` set for Docker Hub authentication (future)
- [ ] Docker Hub org `openfinch` created (future)
- [ ] Automated CI build + push configured (future)

### API Verification
- [ ] `curl http://localhost:8787/health` returns `{"status":"ok"}`
- [ ] `curl http://localhost:8787/health/live` returns `{"status":"alive"}`
- [ ] `curl http://localhost:8787/health/ready` returns `{"status":"ready"}`
- [ ] Search returns results (requires SearXNG)
- [ ] Fetch returns markdown (requires internet)
- [ ] Extract returns JSON (requires LLM provider)

### CLI Verification
- [ ] `npx openfinch health` succeeds
- [ ] `npx openfinch doctor` passes all checks
- [ ] `npx openfinch search "test"` returns results
- [ ] `npx openfinch fetch https://example.com` returns content

### MCP Verification
- [ ] MCP server starts: `docker compose run mcp-server --help`
- [ ] Claude Desktop config works with MCP server
- [ ] MCP tools respond correctly

### Cookbook Verification
- [ ] `cookbook/basic-search/README.md` commands work
- [ ] `cookbook/fetch-docs/README.md` commands work
- [ ] n8n workflows import without errors

### Dashboard
- [ ] Dashboard loads at http://localhost:3000
- [ ] Health status shows green
- [ ] Provider configuration visible

## Brand Assets

- [ ] Logo SVGs created (logo.svg, logo-light.svg, mark.svg, mark-icon.svg)
- [ ] Favicon generated (32×32 SVG/ICO)
- [ ] GitHub social preview created (1200×630px)
- [ ] Colors consistent across assets
- [ ] Mascot illustrations created (optional)

## Screenshots

- [ ] Dashboard overview screenshot
- [ ] CLI doctor output screenshot
- [ ] Search results screenshot
- [ ] Fetch result screenshot
- [ ] Extract result screenshot
- [ ] Browser session screenshot
- [ ] Agent trace screenshot
- [ ] MCP configuration screenshot

## Demo

- [ ] Demo script finalized
- [ ] Demo video recorded (3-5 minutes)
- [ ] Demo checklist completed
- [ ] Pre-demo dry run done
- [ ] Windows PowerShell version tested
- [ ] Bash/Mac version tested

## GitHub Release

### Tag and Push
```bash
# Create and push the version tag
git tag -a v0.1.0 -m "v0.1.0 — Open-source self-hosted AI web agent infrastructure"
git push origin v0.1.0
```

### Create GitHub Release
```bash
# Using gh CLI (preferred — uses the release draft)
gh release create v0.1.0 \
  --title "v0.1.0 — Open-source self-hosted AI web agent infrastructure" \
  --notes-file docs/github-release-v0.1.0.md
```

### Verify Release
- [ ] CI passes on the tag (`.github/workflows/ci.yml` runs automatically)
- [ ] GitHub Release page shows correct changelog
- [ ] Release notes visible with what's new, limitations, safety note
- [ ] GitHub repo description set
- [ ] GitHub topics set (openfinch, web-agent, ai, browser-automation, self-hosted)
- [ ] GitHub social preview image uploaded

## npm Publishing

### Prerequisites
- [ ] `NPM_TOKEN` set in environment or `.npmrc` configured for auth
- [ ] Logged in: `npm whoami` returns your npm username

### SDK JS (`openfinch`)
```bash
# Build
pnpm -F openfinch build

# Dry run (verify package contents)
pnpm -F openfinch publish --dry-run

# Publish
pnpm -F openfinch publish

# Verify
npm install openfinch && node -e "new (require('openfinch').OpenFinch); console.log('SDK OK')"
```

### CLI (`@openfinch/cli`)
```bash
# Build
pnpm -F @openfinch/cli build

# Dry run
pnpm -F @openfinch/cli publish --dry-run

# Publish (scoped package — requires `publishConfig.access: public`)
pnpm -F @openfinch/cli publish

# Verify
npx @openfinch/cli health
```

### MCP Server (`openfinch-mcp`)
```bash
# Build
pnpm -F openfinch-mcp build

# Dry run
pnpm -F openfinch-mcp publish --dry-run

# Publish
pnpm -F openfinch-mcp publish

# Verify
npx openfinch-mcp --help
```

### Post-Publish Verification
- [ ] `npm install openfinch && node -e "new (require('openfinch').OpenFinch)"`
- [ ] `npx @openfinch/cli health`
- [ ] `npx openfinch-mcp --help`
- [ ] Package description matches README tagline
- [ ] npm keywords set
- [ ] Version bumped in package.json after publish

## PyPI Publishing

### Prerequisites
- [ ] `PYPI_TOKEN` set in environment
- [ ] Build tool installed: `pip install build twine`
- [ ] Verified: `twine check dist/*`

### SDK Python (`openfinch`)
```bash
# Build
cd packages/sdk-python
python -m build

# Check
twine check dist/*

# Upload to TestPyPI (dry run)
twine upload --repository testpypi dist/*

# Publish to PyPI
twine upload dist/*

# Verify
pip install openfinch && python -c "from openfinch import OpenFinch; print('PyPI OK')"
```

### Post-Publish Verification
- [ ] `pip install openfinch && python -c "from openfinch import OpenFinch; print('OK')"`
- [ ] PyPI description rendered correctly
- [ ] Version bumped in `pyproject.toml` after publish

## Launch Announcements

- [ ] X/Twitter post drafted
- [ ] LinkedIn post drafted
- [ ] Hacker News post drafted
- [ ] Reddit post drafted (r/selfhosted, r/webdev, r/MachineLearning)
- [ ] Blog post published (optional)
- [ ] Social media graphics prepared
- [ ] Demo video uploaded (YouTube/Loom)

## Documentation

- [ ] README.md is up to date
- [ ] Comparison page published
- [ ] docs/ pages are current
- [ ] .env.example matches actual env vars
- [ ] Architecture diagram reflects current state
- [ ] Screenshots embedded in README
- [ ] Badges are all functional

## Post-Release

- [ ] Monitor GitHub Issues for feedback
- [ ] Monitor npm downloads
- [ ] Monitor Docker pulls
- [ ] Known issues documented
- [ ] Fix critical bugs from feedback
- [ ] Plan next release

## Release Validation

### Local Smoke Tests (no Docker)
- [ ] `pnpm smoke:local` — all local structure and module checks pass
- [ ] `pnpm verify:cookbook` — all 8+ recipes have required files

### Docker Smoke Tests
- [ ] `docker compose up -d` — all services start
- [ ] `pnpm smoke:docker` — health, search, fetch, extract, browser, agent, CLI, MCP pass
- [ ] `pnpm bench` — benchmark runs without errors

### Dashboard
- [ ] `pnpm smoke:dashboard` — Playwright dashboard tests pass (or manual check)
- [ ] Dashboard loads at http://localhost:3000
- [ ] Health status shows green
- [ ] Provider configuration visible

### n8n Integration
- [ ] Import one n8n workflow from `cookbook/n8n-workflows/`
- [ ] Workflow connects to local OpenFinch API

### Cross-Platform
- [ ] Test on Windows (see `docs/windows-validation.md`)
- [ ] Test on WSL2 if available
- [ ] Test MCP in one real client (Claude Desktop, Cursor, or VS Code)

## Health Check Script

```bash
#!/bin/bash
# Quick health check script

echo "=== OpenFinch Health Check ==="

# API
echo -n "API: "
curl -sf http://localhost:8787/health > /dev/null && echo "OK" || echo "FAIL"

# Live
echo -n "Liveness: "
curl -sf http://localhost:8787/health/live > /dev/null && echo "OK" || echo "FAIL"

# Readiness
echo -n "Readiness: "
curl -sf http://localhost:8787/health/ready > /dev/null && echo "OK" || echo "FAIL"

# Search (basic validation)
echo -n "Search Schema: "
curl -sf -X POST http://localhost:8787/v1/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"test","limit":1}' > /dev/null && echo "OK" || echo "FAIL"

# Fetch (basic validation)
echo -n "Fetch Schema: "
curl -sf -X POST http://localhost:8787/v1/fetch \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}' > /dev/null && echo "OK" || echo "FAIL"

echo "=== Done ==="
```
