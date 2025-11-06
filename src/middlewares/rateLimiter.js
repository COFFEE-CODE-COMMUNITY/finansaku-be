import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { redis, isRedisEnabled } from '../config/redis.js'

// === Global Rate Limiter ===
// Uses Redis if ENABLE_REDIS=true, otherwise falls back to in-memory
export const globalRateLimiter = rateLimit({
  store: isRedisEnabled
    ? new RedisStore({
        sendCommand: (...args) => redis.sendCommand(args),
      })
    : undefined,
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// === Auth Rate Limiter ===
// Stricter limits for login/register routes
export const authRateLimiter = rateLimit({
  store: isRedisEnabled
    ? new RedisStore({
        sendCommand: (...args) => redis.sendCommand(args),
      })
    : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per window
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// === IP Blocklist Middleware ===
export const blocklistedIPs = new Set(['0.0.0.0']) // placeholder
export function ipBlocker(req, res, next) {
  if (blocklistedIPs.has(req.ip)) {
    return res.status(403).json({ error: 'Access denied.' })
  }
  next()
}
