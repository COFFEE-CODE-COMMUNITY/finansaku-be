import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { errorHandler } from './middlewares/errorHandler.js'
import { authRateLimiter, globalRateLimiter, ipBlocker } from './middlewares/rateLimiter.js'
import { requestLogger } from './middlewares/requestLogger.js'
import authRoutes from './routes/auth.routes.js'
import systemRoutes from './routes/system.routes.js'
import logger from './config/logger.js'
import { redis, isRedisEnabled } from './config/redis.js' // eslint-disable-line no-unused-vars
import config from './config/index.js'

// === Initialize Express App ===
const app = express()

// === Proxy Trust Configuration ===
if (config.NODE_ENV === 'production') {
  app.set('trust proxy', 1) // trust first proxy (Nginx)
}

// === Core Middlewares ===
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(requestLogger)
app.use(ipBlocker)
logger.info('✅ FinanSaku backend starting...')

// === CORS Configuration ===
const allowedOrigins = [
  'http://localhost:5173',
  'https://finansaku.space',
  'https://www.finansaku.space',
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`))
      }
    },
    credentials: true,
  })
)

app.options(/.*/, cors({ origin: allowedOrigins, credentials: true }))

// === Rate Limiting ===
app.use(globalRateLimiter)
app.use('/api/v1/auth/login', authRateLimiter)

// === Health Check Routes ===
app.get('/', (_req, res) => {
  res.json({ message: 'FinanSaku API is running' })
})

app.get('/api/v1/health', async (_req, res) => {
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

// === API Routes ===
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1', systemRoutes) // aggregator + other system routes

// === Global Error Handling ===
app.use(errorHandler)

export default app
