import winston from 'winston'
import fs from 'fs'
import path from 'path'

const { combine, timestamp, printf, colorize } = winston.format
const logDir = process.env.LOG_DIR || 'logs'

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
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
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

if (process.env.NODE_ENV !== 'production') {
  logger.debug('🪵 Winston logger initialized (development mode)')
}

export default logger
