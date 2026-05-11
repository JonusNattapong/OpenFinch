# Windows Validation Guide

Testing OpenFinch on Windows.

## Prerequisites

- **Windows 10/11** (64-bit)
- **Docker Desktop** for Windows (WSL2 backend recommended)
- **Node.js 22+** (install from [nodejs.org](https://nodejs.org))
- **pnpm 10+** (install: `npm install -g pnpm`)
- **Git** (install from [git-scm.com](https://git-scm.com))
- **PowerShell 7+** (recommended over Windows PowerShell 5.1)

## WSL2 Setup

```powershell
# Check WSL status
wsl --status
wsl --list --verbose

# If not installed:
wsl --install -d Ubuntu

# Set WSL2 as default
wsl --set-default-version 2
```

Docker Desktop should be configured to use WSL2 backend:
1. Open Docker Desktop → Settings → Resources → WSL Integration
2. Enable integration with your WSL distro

## PowerShell vs CMD vs bash

### PowerShell curl
PowerShell has a built-in `curl` alias for `Invoke-RestMethod`. It does NOT work like Unix curl:

```powershell
# ❌ This doesn't work as expected in PowerShell:
curl http://localhost:8787/health

# ✅ Use curl.exe instead:
curl.exe http://localhost:8787/health

# ✅ Or use Invoke-RestMethod:
Invoke-RestMethod -Uri http://localhost:8787/health -Method Get

# ✅ Or use the CLI:
npx @openfinch/cli health
```

### Port Conflicts

Check if ports are in use:

```powershell
netstat -ano | findstr ":8787"
netstat -ano | findstr ":3000"
netstat -ano | findstr ":5432"
netstat -ano | findstr ":6379"
```

Change ports in `.env` if conflicts occur:

```env
API_PORT=8788
DASHBOARD_PORT=3001
```

## Quick Start (PowerShell)

```powershell
# Clone
git clone https://github.com/openfinch/openfinch.git
cd openfinch

# Copy env
copy .env.example .env

# Edit .env with notepad
notepad .env

# Start Docker Compose
docker compose up -d

# Verify
curl.exe http://localhost:8787/health

# Run diagnostics
npx @openfinch/cli doctor
```

## pnpm Install Troubleshooting

### Long Paths on Windows

Some npm dependencies may exceed Windows MAX_PATH (260 chars):

```powershell
# Enable long paths (requires admin PowerShell):
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# Or clone to a short path:
git clone https://github.com/openfinch/openfinch.git C:\of
```

### Build Tools

If native modules fail to compile:

```powershell
# Install Windows Build Tools (admin PowerShell):
npm install --global windows-build-tools
```

## Docker Desktop Notes

### Resource Allocation

Docker Desktop on Windows uses a VM. Allocate sufficient resources:
- **CPUs**: 4+ cores
- **Memory**: 8GB+ (16GB recommended with browser workloads)
- **Swap**: 2GB

Settings → Resources → Advanced

### Volume Mounts

Volume mounts from Windows to Linux containers have performance overhead.
For better performance, clone the repo inside WSL2 and run from there.

### Restarting

```powershell
# Restart Docker Desktop if services are stuck
# Open Docker Desktop → Troubleshoot → Restart

# Or via CLI:
& "C:\Program Files\Docker\Docker\Docker Desktop.exe" --restart
```

## Ollama on Windows

```powershell
# Download from https://ollama.com/download/windows
# Or via winget:
winget install Ollama.Ollama

# Start Ollama
ollama serve

# Pull a small model
ollama pull llama3.2

# Verify Ollama is working
curl.exe http://localhost:11434/api/tags
```

### Using Ollama with Docker Compose

On Windows, the API connects to Ollama on the host via `host.docker.internal`.
This is configured by default in `.env.example`:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

## Firewall Notes

Docker Desktop and OpenFinch services need firewall exceptions:

```powershell
# Check if ports are blocked (admin PowerShell):
Test-NetConnection -ComputerName localhost -Port 8787
Test-NetConnection -ComputerName localhost -Port 5432

# Add firewall rule if needed (admin PowerShell):
New-NetFirewallRule -DisplayName "OpenFinch API" -Direction Inbound `
  -LocalPort 8787 -Protocol TCP -Action Allow
```

## Path Length Issues

Some npm packages can create paths longer than 260 characters:

```powershell
# Check current limit
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled"

# Workaround: use a short clone path
git clone https://github.com/openfinch/openfinch.git C:\of

# Workaround: use WSL2
wsl
cd ~
git clone https://github.com/openfinch/openfinch.git
cd openfinch
pnpm install
```

## Common Windows Issues

### "docker" is not recognized

```powershell
# Docker Desktop not installed or not running
# Install: https://docs.docker.com/desktop/install/windows-install/
# Or add to PATH manually:
$env:Path += ";C:\Program Files\Docker\Docker\resources\bin"
```

### "pnpm" is not recognized

```powershell
# Install pnpm globally:
npm install -g pnpm

# Or enable Corepack:
corepack enable
corepack prepare pnpm@10 --activate
```

### "curl" is PowerShell alias

```powershell
# Use curl.exe for Unix-compatible curl
# Or use Invoke-RestMethod
# Or use the CLI:
npx @openfinch/cli health
```

### Browser worker fails

Playwright needs Chromium on Windows:

```powershell
# Install Chromium for Playwright
npx playwright install chromium

# Or use Docker Compose (recommended)
docker compose up -d browser-worker
```

## Verification Checklist

- [ ] Docker Desktop installed and running
- [ ] WSL2 enabled (recommended)
- [ ] Node.js 22+ installed
- [ ] pnpm 10+ installed
- [ ] Git installed
- [ ] Long paths enabled (if needed)
- [ ] Ports 8787, 3000, 5432, 6379 available
- [ ] Firewall allows Docker networking
- [ ] Ollama installed (optional, for local LLM)
- [ ] `curl.exe` available (not PowerShell alias)
