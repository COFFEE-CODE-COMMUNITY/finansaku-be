import * as Sentry from '@sentry/node'
import dotenv from 'dotenv'

// Load environment variables early
dotenv.config()

// Define release manually for Windows environments
const release =
  process.env.SENTRY_RELEASE ||
  process.env.npm_package_version ||
  '1.0.0'

// Initialize Sentry as early as possible
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
    release,
  })

  console.log(`🪶 [Sentry] Instrumentation initialized (release: ${release})`)
} else {
  console.log('⚠️ [Sentry] DSN not provided, skipping instrumentation')
}
