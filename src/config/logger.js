import winston from 'winston'

const { combine, timestamp, printf, colorize } = winston.format

// === Custom log format ===
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}] ${stack || message}`
})

// === Winston Logger Configuration ===
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
})

// In development, also log to console with color
if (process.env.NODE_ENV !== 'production') {
  logger.debug('🪵 Winston logger initialized (development mode)')
}

export default logger
