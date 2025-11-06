echo "🚀 Starting FinanSaku deployment..."

# Go to your backend folder
cd /root/finansaku || { echo "❌ Project directory not found"; exit 1; }

echo "🔄 Pulling latest changes from GitHub..."
git fetch origin dev-a
git reset --hard origin/dev-a

echo "📦 Installing dependencies..."
npm install --omit=dev

# Optional: uncomment if you build assets
# echo "🏗️ Building project..."
# npm run build

echo "🔁 Restarting PM2 process..."
pm2 restart finansaku --update-env

echo "🧹 Cleaning up old logs..."
pm2 flush

echo "✅ Deployment complete!"
