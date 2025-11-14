import logger from '../config/logger.js'
import config from '../config/index.js'

// === Custom Error Class ===
// Use this to throw errors with a specific status code
export class AppError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

// === Global Error Handler Middleware ===
// Catches any thrown error and formats a standardized response
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  // Log full error details (always)
  logger.error(`[ERROR] ${req.method} ${req.originalUrl}`, {
    statusCode,
    message: err.message,
    stack: err.stack,
  })

  // Avoid duplicate responses if headers already sent
  if (res.headersSent) return next(err)

  // Only include stack trace in non-production for safety
  const isProduction = config.NODE_ENV === 'production'

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(isProduction ? {} : { stack: err.stack }),
  })
}