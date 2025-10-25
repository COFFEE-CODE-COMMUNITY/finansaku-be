import redis from '../config/redis.js'
import crypto from 'crypto'

export async function generateToken(prefix, userId, ttlSeconds = 1800) {
  if (!userId) throw new Error(`generateToken: missing userId for prefix=${prefix}`)
  if (!Number.isFinite(ttlSeconds)) throw new Error('generateToken: ttlSeconds must be a number')

  const token = crypto.randomUUID()
  const key = `${prefix}:${token}`

  // version-proof way: set value, then set expiry
  await redis.set(key, String(userId))
  await redis.expire(key, Math.floor(ttlSeconds))

  return token
}

export async function consumeToken(prefix, token) {
  const key = `${prefix}:${token}`
  const userId = await redis.get(key)
  if (!userId) return null
  await redis.del(key)
  return userId
}
