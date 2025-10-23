import { createClient } from 'redis'
import logger from './logger.js'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
export const redis = createClient({ url: redisUrl })

redis.on('connect', () => logger.info('[Redis] Connected successfully'))
redis.on('error', (err) => logger.error('[Redis] Connection error:', err.message))

// === Safe Connection Wrapper ===
// Will skip connection when VM/Redis not available
if (process.env.ENABLE_REDIS === 'true') {
  ;(async () => {
    try {
      await redis.connect()
      logger.info('[Redis] Connection established')
    } catch (err) {
      logger.warn('⚠️ Redis connection failed (possibly no VM):', err.message)
      logger.warn('ℹ️ Redis features (cache, rate limit) will be disabled temporarily')
    }
  })()
} else {
  logger.info('[Redis] Redis connection skipped (ENABLE_REDIS=false)')
}

export const isRedisEnabled = process.env.ENABLE_REDIS === 'true'
