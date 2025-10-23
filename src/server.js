import dotenv from 'dotenv'
import logger from './config/logger.js'
import app from './app.js'
import { initCronJobs } from './config/cron.js'

// === Load Environment Variables ===
dotenv.config()

// === Initialize Cron Jobs ===
initCronJobs()

// === Server Startup ===
const PORT = process.env.PORT || 8081
const ENV = process.env.NODE_ENV || 'development'

app.listen(PORT, () => {
  logger.info(`🚀 FinanSaku backend running on port ${PORT} (${ENV})`)
})
