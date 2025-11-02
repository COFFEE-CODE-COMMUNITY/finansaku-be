import logger from '../config/logger.js'

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
  const isProduction = process.env.NODE_ENV === 'production'

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(isProduction ? {} : { stack: err.stack }),
  })
}
