import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import * as Sentry from '@sentry/node'

import { errorHandler } from './middlewares/errorHandler.js'
import { authRateLimiter, globalRateLimiter } from './middlewares/rateLimiter.js'
import { requestLogger } from './middlewares/requestLogger.js'
import authRoutes from './routes/auth.routes.js'
import logger from './config/logger.js'
import { redis } from './config/redis.js' // eslint-disable-line no-unused-vars

// === Load Environment Variables ===
dotenv.config()

// === Initialize Express App ===
const app = express()

// === Initialize Sentry (only if DSN exists) ===
if (process.env.SENTRY_DSN) {
  // Explicit release fallback for Windows / PowerShell (no var expansion)
  const release =
    process.env.SENTRY_RELEASE ||
    process.env.npm_package_version ||
    '1.0.0'

  await Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    release,
    integrations: [
      Sentry.extraErrorDataIntegration(),
      Sentry.contextLinesIntegration(),
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
    ],
  })

  logger.info(`🪶 Sentry monitoring initialized (release: ${release})`)

  // Compatibility shim for old/new APIs
  const hasOldAPI = !!Sentry.Handlers?.requestHandler
  const hasNewAPI = !!Sentry.setupExpressRequestHandler

  if (hasOldAPI) {
    app.use(Sentry.Handlers.requestHandler())
  } else if (hasNewAPI) {
    app.use(Sentry.setupExpressRequestHandler())
  } else {
    logger.warn('⚠️ No compatible Sentry request handler found')
  }

  // Store the error handler for later
  app.locals.sentryErrorHandler = hasOldAPI
    ? Sentry.Handlers.errorHandler()
    : hasNewAPI
    ? Sentry.setupExpressErrorHandler()
    : null
}

// === Core Middlewares ===
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(requestLogger)
logger.info('✅ FinanSaku backend starting...')

// === CORS Configuration ===
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)

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

// === Debug Route for Sentry Test ===
app.get('/debug-sentry', () => {
  throw new Error('My first Sentry error!')
})

// === API Routes ===
app.use('/api/v1/auth', authRoutes)

// === Error Handling (Sentry + Global Logger) ===
if (process.env.SENTRY_DSN && app.locals.sentryErrorHandler) {
  app.use(app.locals.sentryErrorHandler)
}

app.use(errorHandler)

export default app
