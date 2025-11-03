import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { errorHandler } from './middlewares/errorHandler.js'
import { authRateLimiter, globalRateLimiter } from './middlewares/rateLimiter.js'
import { requestLogger } from './middlewares/requestLogger.js'
import authRoutes from './routes/auth.routes.js'
import logger from './config/logger.js'
import { redis } from './config/redis.js' // eslint-disable-line no-unused-vars

// === Load Environment Variables ===
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
})

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
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:5173'],
  credentials: true,
}))

// Handle preflight
app.options(/.*/, cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:5173'],
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

// === Global Error Handling ===
app.use(errorHandler)

export default app
