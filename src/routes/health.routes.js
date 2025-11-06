import express from 'express'
import { isRedisEnabled, redis } from '../config/redis.js'

const router = express.Router()

router.get('/', async (req, res) => {
  let redisStatus = 'disabled'
  if (isRedisEnabled) {
    try {
      await redis.ping()
      redisStatus = 'healthy'
    } catch {
      redisStatus = 'unreachable'
    }
  }

  res.json({
    ok: true,
    uptime: process.uptime(),
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  })
})

export default router
