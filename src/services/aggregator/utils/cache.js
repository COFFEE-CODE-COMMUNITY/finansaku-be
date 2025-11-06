import { redis } from '../../config/redis.js'

const hasRedis = () => process.env.ENABLE_REDIS === 'true' && redis?.isReady

export async function getCache(key) {
  if (!hasRedis()) return null
  return redis.get(key).then(v => v ? JSON.parse(v) : null)
}

export async function setCache(key, value, ttlSec) {
  if (!hasRedis()) return
  await redis.set(key, JSON.stringify(value), { EX: ttlSec })
}

export async function delCache(pattern) {
  if (!hasRedis()) return
  const iter = redis.scanIterator({ MATCH: pattern })
  for await (const key of iter) await redis.del(key)
}

export function keySource(type, year, source) {
  return `aggregator:${type}:${year}:src:${source}`
}
export function keyCombined(type, year) {
  return `aggregator:${type}:${year}:combined`
}
export function keyVersion(type) {
  return `aggregator:${type}:version`
}

export async function bumpVersion(type) {
  if (!hasRedis()) return
  const k = keyVersion(type)
  await redis.incr(k)
}
