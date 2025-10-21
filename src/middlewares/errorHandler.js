import logger from '../config/logger.js'

// === Global Error Handler Middleware ===
// Catches any thrown error and formats a standard response
export function errorHandler(err, req, res, next) {
  // Default structure
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  // Log error details
  logger.error(`[ERROR] ${req.method} ${req.originalUrl}`, {
    message: err.message,
    stack: err.stack,
    statusCode,
  })

  // If Sentry is enabled, the handler is already hooked in app.js
  if (res.headersSent) {
    return next(err)
  }

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  })
}
