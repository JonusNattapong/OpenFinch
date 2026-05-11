# ============================================================
# OpenFinch One-Line Deploy (PowerShell - Windows)
# ============================================================
# Run in PowerShell as Administrator:
#
#   irm https://raw.githubusercontent.com/JonusNattapong/OpenFinch/main/deploy.ps1 | iex
#
# Or download and run locally:
#   .\deploy.ps1
#
# Options (env vars):
#   $env:SKIP_MIGRATION = "1"  Skip DB migration
#   $env:OPENAI_API_KEY = "xxx" Set API key
# ============================================================

param(
    [Parameter(Position=0)]
    [ValidateSet("deploy","start","stop","restart","status")]
    [string]$Command = "deploy"
)

$ErrorActionPreference = "Stop"
$Repo = "https://github.com/JonusNattapong/OpenFinch.git"
$TargetDir = $env:TARGET_DIR ?? "openfinch"
$SkipMigration = $env:SKIP_MIGRATION ?? "0"
$ApiKey = $env:OPENAI_API_KEY ?? ""

function Write-Step($msg) { Write-Host "[OpenFinch] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[OpenFinch] WARNING: $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[OpenFinch] ERROR: $msg" -ForegroundColor Red; exit 1 }

function Test-Prereqs {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Err "Docker is not installed. Install Docker Desktop from https://docs.docker.com/desktop/"
    }
    if (-not (docker compose version 2>$null)) {
        Write-Err "Docker Compose is not installed. Install Docker Desktop."
    }
    Write-Step "Prerequisites check passed"
}

function Get-Clone {
    if (Test-Path $TargetDir) {
        Write-Step "Directory '$TargetDir' exists — pulling latest..."
        Push-Location $TargetDir
        git pull origin main
        Pop-Location
    } else {
        Write-Step "Cloning OpenFinch..."
        git clone $Repo $TargetDir
    }
    Set-Location $TargetDir
}

function Set-Configure {
    $envFile = Join-Path (Get-Location) ".env"
    if (-not (Test-Path $envFile)) {
        $example = Join-Path (Get-Location) ".env.example"
        if (Test-Path $example) {
            Write-Step "Creating .env from template..."
            Copy-Item $example $envFile
        }
    }

    if ([string]::IsNullOrEmpty($ApiKey)) {
        $current = if (Test-Path $envFile) { Get-Content $envFile -Raw } else ""
        if ($current -notmatch "OPENAI_API_KEY=sk-") {
            Write-Host ""
            $key = Read-Host "Enter your OpenAI API key (or press Enter to skip)"
            if (-not [string]::IsNullOrWhiteSpace($key)) {
                $content = if (Test-Path $envFile) { Get-Content $envFile -Raw } else ""
                if ($content -match "OPENAI_API_KEY=") {
                    (Get-Content $envFile) -replace "(?<=OPENAI_API_KEY=).*", $key | Set-Content $envFile
                } else {
                    Add-Content $envFile "OPENAI_API_KEY=$key"
                }
                Write-Step "API key saved to .env"
            }
        }
    } else {
        $envFile = Join-Path (Get-Location) ".env"
        $content = if (Test-Path $envFile) { Get-Content $envFile -Raw } else ""
        if ($content -match "OPENAI_API_KEY=") {
            (Get-Content $envFile) -replace "(?<=OPENAI_API_KEY=).*", $ApiKey | Set-Content $envFile
        } else {
            Add-Content $envFile "OPENAI_API_KEY=$ApiKey"
        }
        Write-Step "API key set from env variable"
    }
}

function Start-Services {
    Write-Step "Starting OpenFinch..."
    docker compose up -d

    Write-Step "Waiting for API to be ready..."
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep 1
        if (curl -sf http://localhost:8787/health -ErrorAction SilentlyContinue) {
            $ready = $true
            Write-Step "OpenFinch is running!"
            Write-Host ""
            Write-Host "  API:        http://localhost:8787"
            Write-Host "  Dashboard:  http://localhost:3000  (run: docker compose --profile full up -d)"
            Write-Host "  Health:     http://localhost:8787/health"
            Write-Host ""
            Write-Host "  First agent run:"
            Write-Host '    curl -X POST http://localhost:8787/v1/agent/run \'
            Write-Host '      -H "Content-Type: application/json" \'
            Write-Host '      -d "{\"goal\": \"Go to example.com and summarize it\", \"startUrl\": \"https://example.com\"}"'
            Write-Host ""
            return
        }
    }
    Write-Err "API did not become ready in 30 seconds. Check logs: docker compose logs api"
}

function Stop-Services {
    Write-Step "Stopping OpenFinch..."
    docker compose down
}

# Entry point
Write-Host ""
Write-Host "=========================================="
Write-Host "  OpenFinch One-Line Deploy"
Write-Host "  https://github.com/JonusNattapong/OpenFinch"
Write-Host "=========================================="
Write-Host ""

switch ($Command) {
    "deploy" {
        Test-Prereqs
        Get-Clone
        Set-Configure
        Start-Services
    }
    "start" {
        Set-Location $TargetDir
        Start-Services
    }
    "stop" {
        Set-Location $TargetDir
        Stop-Services
    }
    "restart" {
        Set-Location $TargetDir
        Stop-Services
        Start-Services
    }
    "status" {
        try {
            $r = Invoke-RestMethod http://localhost:8787/health -ErrorAction Stop
            $r | ConvertTo-Json -Depth 10
        } catch {
            Write-Host "API not reachable" -ForegroundColor Yellow
        }
    }
}
