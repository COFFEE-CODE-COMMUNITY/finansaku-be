import dotenv from 'dotenv'
import app from './app.js'
import config from './config/index.js'
import { redis, isRedisEnabled } from './config/redis.js'

// === Load environment variables early ===
dotenv.config({
  path: config.NODE_ENV === 'production' ? '.env.production' : '.env',
})
console.log('✅ Environment variables loaded')

// === Define release and environment ===
const release = config.npm_package_version || 'development-build'
const PORT = config.PORT || 8081
const ENV = config.NODE_ENV || 'development'

console.log(`🚀 FinanSaku backend starting (release: ${release}, env: ${ENV})`)

// === Redis Startup Probe ===
async function startupProbe() {
  if (!isRedisEnabled) {
    console.log('ℹ️ Redis disabled — skipping startup probe')
    return
  }

  try {
    await redis.ping()
    console.log('✅ Redis reachable at startup')
  } catch (err) {
    console.warn('⚠️ Redis not reachable at startup (continuing without cache)')
    console.warn(err?.message || err)
  }
}

await startupProbe()

// === Start server ===
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})
