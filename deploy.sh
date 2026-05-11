#!/usr/bin/env bash
# ============================================================
# OpenFinch One-Line Deploy
# ============================================================
# Run this on any machine with Docker + Docker Compose installed.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/JonusNattapong/OpenFinch/main/deploy.sh | bash
#
# Or clone and run locally:
#   bash deploy.sh
#
# Options:
#   SKIP_MIGRATION=1  Skip DB migration step
#   OPENAI_API_KEY=xxx Set API key on first run
# ============================================================

set -euo pipefail

REPO="https://github.com/JonusNattapong/OpenFinch.git"
TARGET_DIR="${TARGET_DIR:-openfinch}"
SKIP_MIGRATION="${SKIP_MIGRATION:-0}"
OPENAI_API_KEY="${OPENAI_API_KEY:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[OpenFinch]${NC} $*"; }
warn() { echo -e "${YELLOW}[OpenFinch]${NC} WARNING: $*"; }
error() { echo -e "${RED}[OpenFinch]${NC} ERROR: $*" >&2; exit 1; }

# Check prerequisites
check() {
  if ! command -v docker &>/dev/null; then
    error "Docker is not installed. Install from https://docs.docker.com/get-docker/"
  fi
  if ! docker compose version &>/dev/null; then
    error "Docker Compose is not installed. Install Docker Desktop or docker-compose plugin."
  fi
  log "Prerequisites check passed"
}

# Clone or update repo
setup() {
  if [ -d "$TARGET_DIR" ]; then
    log "Directory '$TARGET_DIR' exists — pulling latest..."
    cd "$TARGET_DIR"
    git pull origin main
  else
    log "Cloning OpenFinch..."
    git clone "$REPO" "$TARGET_DIR"
    cd "$TARGET_DIR"
  fi
}

# Create .env from example
configure() {
  if [ ! -f .env ]; then
    log "Creating .env from template..."
    cp .env.example .env
  fi

  # Prompt for API key if not set
  if ! grep -q "OPENAI_API_KEY=sk-" .env 2>/dev/null && \
     ! grep -q 'OPENAI_API_KEY="sk-' .env 2>/dev/null && \
     [ -z "$OPENAI_API_KEY" ]; then
    echo ""
    read -rp "Enter your OpenAI API key (or press Enter to skip): " KEY
    if [ -n "$KEY" ]; then
      sed -i "s|^OPENAI_API_KEY=|OPENAI_API_KEY=$KEY|" .env
      log "API key saved to .env"
    fi
  fi
}

# Apply migrations
migrate() {
  if [ "$SKIP_MIGRATION" = "1" ]; then
    warn "Skipping DB migration (SKIP_MIGRATION=1)"
    return
  fi

  log "Applying database migrations..."
  if ! docker compose exec -T api pnpm drizzle-kit migrate 2>/dev/null; then
    warn "Migration skipped — run 'docker compose exec api pnpm drizzle-kit migrate' manually after first start"
  else
    log "Migrations applied"
  fi
}

# Start services
start() {
  log "Starting OpenFinch..."
  docker compose up -d

  log "Waiting for API to be ready..."
  for i in $(seq 1 30); do
    if curl -sf http://localhost:8787/health >/dev/null 2>&1; then
      log "OpenFinch is running!"
      echo ""
      echo "  API:        http://localhost:8787"
      echo "  Dashboard:  http://localhost:3000  (run: docker compose --profile full up -d)"
      echo "  Health:    http://localhost:8787/health"
      echo ""
      echo "  First agent run:"
      echo "    curl -X POST http://localhost:8787/v1/agent/run \\"
      echo "      -H 'Content-Type: application/json' \\"
      echo "      -d '{\"goal\": \"Go to example.com and summarize it\", \"startUrl\": \"https://example.com\"}'"
      echo ""
      return
    fi
    sleep 1
  done

  error "API did not become ready in 30 seconds. Check logs: docker compose logs api"
}

# Stop services
stop() {
  log "Stopping OpenFinch..."
  docker compose down
}

# Main
main() {
  echo ""
  echo "=========================================="
  echo "  OpenFinch One-Line Deploy"
  echo "  https://github.com/JonusNattapong/OpenFinch"
  echo "=========================================="
  echo ""

  check
  setup
  configure
  start
}

# Handle CLI arguments
case "${1:-deploy}" in
  deploy)   main ;;
  start)    cd "$TARGET_DIR" && start ;;
  stop)     cd "$TARGET_DIR" && stop ;;
  restart)  cd "$TARGET_DIR" && stop && start ;;
  logs)     cd "$TARGET_DIR" && docker compose logs -f "${2:-}" ;;
  status)   curl -sf http://localhost:8787/health | python3 -m json.tool 2>/dev/null || echo "API not reachable" ;;
  *)        echo "Usage: $0 {deploy|start|stop|restart|logs|status}" ;;
esac
