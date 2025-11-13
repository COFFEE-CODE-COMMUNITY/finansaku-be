#!/usr/bin/env bash
set -euo pipefail

# 1. Read the branch name (e.g., "main" or "dev") from the first argument
#    Defaults to "dev" if no argument is provided.
BRANCH=${1:-dev}

# Go to your backend folder
cd /root/finansaku || { echo "❌ Project directory not found"; exit 1; }

echo "🔄 Pulling latest changes from $BRANCH..."
git fetch origin $BRANCH
git reset --hard origin/$BRANCH

# 2. Run a full npm install to get devDependencies (like prisma)
echo "📦 Installing ALL dependencies (for Prisma)..."
npm install

# 3. Add the prisma generate step
echo "🧬 Generating Prisma client..."
npx prisma generate

echo "🔁 Restarting PM2 process..."
pm2 restart finansaku --update-env

echo "🧹 Cleaning up old logs..."
pm2 flush

echo "✅ Deployment complete!"
