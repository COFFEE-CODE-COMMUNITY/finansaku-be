import cron from 'node-cron'
import logger from './logger.js'
import { autoSync } from '../services/aggregator/aggregator.service.js'
import config from '../config/index.js'

// === Cron Configuration ===
// Default: run once a month (first day at 03:00)
const cronExpr = config.AGGREGATOR_CRON_EXPRESSION || '0 3 1 * *'

// === Register Aggregator Sync Job ===
export const initCronJobs = () => {
  logger.info(`🕒 [Cron] Aggregator job scheduled with expression: ${cronExpr}`)

  cron.schedule(cronExpr, async () => {
    logger.info('🔄 [Cron] Starting automatic aggregator sync...')
    try {
      await autoSync()
      logger.info('✅ [Cron] Aggregator sync completed successfully')
    } catch (err) {
      logger.error('❌ [Cron] Aggregator sync failed:', err.message)
    }
  })
}
