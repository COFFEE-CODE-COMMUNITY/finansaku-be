import winston from 'winston'
import fs from 'fs'
import path from 'path'
import config from '../config/index.js'

const { combine, timestamp, printf, colorize } = winston.format
const logDir = config.LOG_DIR || 'logs'

// === Ensure log directory exists ===
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// === Custom log format ===
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}] ${stack || message}`
})

// === Winston Logger Configuration ===
const logger = winston.createLogger({
  level: config.LOG_LEVEL || (config.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
})

if (config.NODE_ENV !== 'production') {
  logger.debug('🪵 Winston logger initialized (development mode)')
}

export default logger
