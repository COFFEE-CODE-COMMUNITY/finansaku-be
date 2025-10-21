import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import * as Sentry from '@sentry/node'

import { errorHandler } from './middlewares/errorHandler.js'
import { authRateLimiter } from './middlewares/rateLimiter.js'
import { requestLogger } from './middlewares/requestLogger.js'
import authRoutes from './routes/auth.routes.js'
import logger from './config/logger.js'

// === Load Environment Variables ===
dotenv.config()

// === Initialize Express App ===
const app = express()

// === Initialize Sentry (only if DSN exists) ===
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  })
  logger.info('🪶 Sentry monitoring initialized')
  app.use(Sentry.Handlers.requestHandler())
}

// === Core Middlewares ===
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// === Request Logger ===
app.use(requestLogger)
logger.info('✅ FinanSaku backend starting...')

// === CORS Configuration ===
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)

// === Rate Limiter ===
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

// === Error Handling (Sentry + Global Logger) ===
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler())
}

app.use(errorHandler)

// === Server Startup ===
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 8081
  app.listen(PORT, () => {
    logger.info(`✅ FinanSaku backend running on port ${PORT}`)
  })
}

export default app
