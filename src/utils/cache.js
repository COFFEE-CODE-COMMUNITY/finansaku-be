// === Redis Cache Utilities ===
import { redis, isRedisEnabled } from '../config/redis.js'

// === Check Redis Availability ===
const hasRedis = () => isRedisEnabled && redis?.isReady

// === Default TTL (seconds) ===
const DEFAULT_TTL = 60

// === Safe JSON Parser ===
const safeParse = (str) => {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

// === Get Cached JSON ===
export async function getCache(key) {
  if (!hasRedis()) return null
  try {
    const value = await redis.get(key)
    return value ? safeParse(value) : null
  } catch {
    return null
  }
}

// === Set Cache Value with TTL (seconds) ===
export async function setCache(key, value, ttlSec = DEFAULT_TTL) {
  if (!hasRedis()) return
  try {
    await redis.set(key, JSON.stringify(value), { EX: ttlSec })
  } catch {
    // fail silently — non-critical
  }
}

// === Delete Keys by Pattern ===
export async function delCache(pattern) {
  if (!hasRedis()) return
  try {
    for await (const key of redis.scanIterator({ MATCH: pattern })) {
      await redis.del(key)
    }
  } catch {
    // fail silently — non-critical
  }
}

// === Redis Key Builders (for consistent naming) ===
export const keySource   = (type, year, source) => `aggregator:${type}:${year}:src:${source}`
export const keyCombined = (type, year)         => `aggregator:${type}:${year}:combined`
export const keyVersion  = (type)               => `aggregator:${type}:version`

// === Version Incrementer (for aggregator cache invalidation) ===
export async function bumpVersion(type) {
  if (!hasRedis()) return
  try {
    await redis.incr(keyVersion(type))
  } catch {
    // fail silently — non-critical
  }
}
