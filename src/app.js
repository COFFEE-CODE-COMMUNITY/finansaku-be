import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { errorHandler } from './middlewares/errorHandler.js'
import { authRateLimiter, globalRateLimiter } from './middlewares/rateLimiter.js'
import { requestLogger } from './middlewares/requestLogger.js'
import { authenticate } from './middlewares/auth.middleware.js'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import sakuRoutes from './routes/saku.routes.js'
import umkRoutes from './routes/umk.routes.js'
import notificationRoutes from './routes/notifications.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import historyRoutes from './routes/history.routes.js'
import allocationRoutes from './routes/allocation.routes.js'
import logger from './config/logger.js'
import { redis } from './config/redis.js' // eslint-disable-line no-unused-vars

// === Initialize Express App ===
const app = express()

// === Proxy Trust Configuration ===
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', '127.0.0.1')
} else {
  app.set('trust proxy', false)
  process.env.EXPRESS_RATE_LIMIT_TRUST_PROXY = 'false'
}

// === Core Middlewares ===
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(requestLogger)
logger.info('✅ FinanSaku backend starting...')

// === CORS Configuration ===
const allowedOrigins = [
  'http://localhost:5173',
  'https://finansaku.space',
  'https://www.finansaku.space',
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`))
    }
  },
  credentials: true,
}))

app.options(/.*/, cors({
  origin: allowedOrigins,
  credentials: true,
}))

// === Rate Limiting ===
app.use(globalRateLimiter)
app.use('/api/v1/auth/login', authRateLimiter)

// === Health Check Routes ===
app.get('/', (_req, res) => {
  res.json({ message: 'FinanSaku API is running' })
})

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// === API Routes ===
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', authenticate, userRoutes)
app.use('/api/v1/saku', authenticate, sakuRoutes)
app.use('/api/v1/umk', authenticate, umkRoutes)
app.use('/api/v1/allocations', authenticate, allocationRoutes)
app.use('/api/v1/notifications', authenticate, notificationRoutes)
app.use('/api/v1/dashboard', authenticate, dashboardRoutes)
app.use('/api/v1/history', authenticate, historyRoutes)

// === Global Error Handling ===
app.use(errorHandler)

export default app
