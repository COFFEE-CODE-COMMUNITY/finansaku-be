import { createClient } from 'redis'
import logger from './logger.js'
import config from '../config/index.js'

// === Redis Connection Config ===
const redisHost = config.REDIS_HOST || '127.0.0.1'
const redisPort = config.REDIS_PORT || 6379
const redisPassword = config.REDIS_PASSWORD || ''
const redisUrl =
  config.REDIS_URL ||
  `redis://${redisPassword ? ':' + encodeURIComponent(redisPassword) + '@' : ''}${redisHost}:${redisPort}`

logger.info(`[Redis] Connecting to: ${redisUrl} (ENABLE_REDIS=${config.ENABLE_REDIS})`)

// === Create Redis Client ===
const client = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(1000, retries * 100),
    timeout: 5000,
  },
  password: redisPassword || undefined,
})

// === Connection Events ===
client.on('connect', () => logger.info('[Redis] Connecting...'))
client.on('ready', () => logger.info('[Redis] Ready for commands ✅'))
client.on('error', (err) => logger.error('[Redis] Connection error', err))
client.on('end', () => logger.warn('[Redis] Connection closed ❌'))

// === Safe Connection Wrapper ===
if (config.ENABLE_REDIS === 'true') {
  ;(async () => {
    try {
      await client.connect()
      logger.info('[Redis] Connection established successfully')
    } catch (err) {
      logger.warn('⚠️ Redis connection failed (check VM, password, or URL):', err)
      logger.warn('ℹ️ Redis features (cache, rate limit) temporarily disabled')
    }
  })()
} else {
  logger.info('[Redis] Connection skipped (ENABLE_REDIS=false)')
}

// === Exports ===
export const redis = client
export const isRedisEnabled = config.ENABLE_REDIS === 'true'
export default client

// === Optional: Health Probe (non-blocking) ===
;(async function probeRedis() {
  if (config.ENABLE_REDIS !== 'true') return
  try {
    const key = 'fs:probe'
    await client.set(key, '1', { EX: 5 })
    await client.get(key)
    logger.info('✅ Redis probe OK')
  } catch (err) {
    logger.warn('[Redis] Probe failed, fallback to in-memory cache')
  }
})()
