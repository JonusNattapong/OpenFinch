#!/usr/bin/env bash
# ============================================================
# Deploy OpenFinch docs to GitHub Pages
# ============================================================
# Prerequisites:
#   - Git remote must be configured
#   - GitHub Pages must be enabled on the repo (Settings → Pages → Source: GitHub Actions)
#
# Usage:
#   bash site/deploy.sh          # Dry run (build only)
#   GITHUB_DEPLOY=1 bash site/deploy.sh  # Deploy to gh-pages branch
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$SCRIPT_DIR/.vitepress/dist"
BRANCH="gh-pages"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log() { echo -e "${GREEN}[docs]${NC} $*"; }
error() { echo -e "${RED}[docs]${NC} ERROR: $*" >&2; exit 1; }

# Check prerequisites
check() {
  if [ ! -d "$DIST_DIR" ]; then
    error "Dist directory not found. Run 'pnpm docs:build' first."
  fi
  git rev-parse --git-dir > /dev/null 2>&1 || error "Not a git repository."
  git remote get-url origin > /dev/null 2>&1 || error "No origin remote configured."
  log "Prerequisites OK"
}

# Build
build() {
  log "Building docs..."
  cd "$SCRIPT_DIR"
  pnpm install --ignore-scripts 2>/dev/null || true
  pnpm build
  log "Build complete → $DIST_DIR"
}

# Deploy to GitHub Pages via gh-pages branch
deploy() {
  log "Deploying to GitHub Pages..."

  cd "$ROOT_DIR"

  # Create temp dir for deploy
  DEPLOY_DIR=$(mktemp -d)
  git clone --depth 1 "file://$(pwd)" "$DEPLOY_DIR" -b "$BRANCH" 2>/dev/null || {
    # Branch doesn't exist yet, create it
    mkdir -p "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    git init
    git config user.name "github-actions[bot]"
    git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  }

  cd "$DEPLOY_DIR"
  # Remove old content (except .nojekyll for GitHub Pages)
  rm -rf .[!.]* * 2>/dev/null || true

  # Copy new content
  cp -r "$DIST_DIR/"* .

  # Add .nojekyll to disable Jekyll processing
  touch .nojekyll

  # Commit and push
  git add .
  git commit -m "docs: deploy $(date -u '+%Y-%m-%d %H:%M:%S')"
  git push -f origin "$BRANCH"

  rm -rf "$DEPLOY_DIR"
  log "Deployed to https://$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/' | tr '/' '-')-$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/' | awk -F'-' '{print $1}').github.io/ or custom domain"
}

main() {
  echo ""
  echo "=========================================="
  echo "  OpenFinch Docs Deploy"
  echo "=========================================="
  echo ""

  check
  build

  if [ "${GITHUB_DEPLOY:-}" = "1" ]; then
    deploy
  else
    log "Dry run complete. Set GITHUB_DEPLOY=1 to deploy."
    log "Or run: pnpm docs:preview to preview locally."
  fi
}

main
