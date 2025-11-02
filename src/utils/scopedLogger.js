import logger from '../config/logger.js'

// === Scoped Logger Factory ===
// Provides contextual logging for specific modules or features
export function createLogger(scope) {
  return {
    info: (msg, meta) => logger.info(`[${scope}] ${msg}`, meta),
    error: (msg, meta) => logger.error(`[${scope}] ${msg}`, meta),
    warn: (msg, meta) => logger.warn(`[${scope}] ${msg}`, meta),
    debug: (msg, meta) => logger.debug(`[${scope}] ${msg}`, meta),
  }
}
