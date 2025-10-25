import { createClient } from 'redis'
import logger from './logger.js'

const redisHost = process.env.REDIS_HOST || '127.0.0.1'
const redisPort = process.env.REDIS_PORT || 6379
const redisPassword = process.env.REDIS_PASSWORD || ''
const redisUrl =
  process.env.REDIS_URL || `redis://${redisPassword ? ':' + encodeURIComponent(redisPassword) + '@' : ''}${redisHost}:${redisPort}`

logger.info(`[Redis] Connecting to: ${redisUrl} (ENABLE_REDIS=${process.env.ENABLE_REDIS})`)

const client = createClient({
  url: redisUrl,
  password: redisPassword || undefined,
})

client.on('connect', () => logger.info('[Redis] Connecting...'))
client.on('ready', () => logger.info('[Redis] Ready for commands'))
client.on('error', (err) => {
  logger.error('[Redis] Connection error:', err)
})
client.on('end', () => logger.warn('[Redis] Connection closed'))

// === Safe Connection Wrapper ===
// Connect only when ENABLE_REDIS=true to prevent crash loops
if (process.env.ENABLE_REDIS === 'true') {
  ;(async () => {
    try {
      await client.connect()
      logger.info('[Redis] Connection established successfully ✅')
    } catch (err) {
      logger.warn('⚠️ Redis connection failed (check VM, password, or URL):', err)
      logger.warn('ℹ️ Redis features (cache, rate limit) temporarily disabled')
    }
  })()
} else {
  logger.info('[Redis] Connection skipped (ENABLE_REDIS=false)')
}

// === Export as default (so "import redis from ..." works) ===
export default client

// === Optional named export ===
export const redis = client
export const isRedisEnabled = process.env.ENABLE_REDIS === 'true'
