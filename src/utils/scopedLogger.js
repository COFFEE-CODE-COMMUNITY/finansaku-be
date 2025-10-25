import logger from '../config/logger.js'

export function createLogger(scope) {
  return {
    info: (msg, meta) => logger.info(`[${scope}] ${msg}`, meta),
    error: (msg, meta) => logger.error(`[${scope}] ${msg}`, meta),
    warn: (msg, meta) => logger.warn(`[${scope}] ${msg}`, meta),
    debug: (msg, meta) => logger.debug(`[${scope}] ${msg}`, meta),
  }
}
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="601327f7-f27f-5b5f-940b-77134de7d661")}catch(e){}}();
//# debugId=601327f7-f27f-5b5f-940b-77134de7d661
