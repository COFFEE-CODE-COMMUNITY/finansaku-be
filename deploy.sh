#!/usr/bin/env bash
set -euo pipefail

# Urutan prioritas:
# 1) Argumen posisi $1
# 2) Env BRANCH
# 3) Default fallback
BRANCH="${1:-${BRANCH:-dev-b}}"

echo "🚀 Deploying FinanSaku (branch: $BRANCH)"
git fetch origin "$BRANCH"
# checkout jika belum ada lokalnya
git rev-parse --verify "$BRANCH" >/dev/null 2>&1 || git switch -c "$BRANCH" --track "origin/$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "📦 Installing dependencies..."
npm ci --omit=dev || npm ci

echo "🔁 Restarting PM2..."
pm2 restart finansaku || pm2 start ecosystem.config.cjs --only finansaku

echo "✅ Done."
