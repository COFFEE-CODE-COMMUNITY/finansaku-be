import cron from 'node-cron'
import logger from '../config/logger.js'
import { autoSync } from '../services/aggregator/aggregator.service.js'
import config from '../config/index.js'

// === Cron Configuration ===
// Default: 1st day of each month at 03:00 (Asia/Jakarta)
const cronExpr = config.AGGREGATOR_CRON_EXPRESSION || '0 3 1 * *'

// === Register Aggregator Cron Job ===
export function registerAggregatorCron() {
  if (!config.AGGREGATOR_ENABLE_CRON) {
    logger.info('🕒 [Cron] Aggregator cron disabled (AGGREGATOR_ENABLE_CRON=false)')
    return
  }

  logger.info(`🕒 [Cron] Aggregator job scheduled with expression: ${cronExpr}`)

  cron.schedule(
    cronExpr,
    async () => {
      const year = new Date().getFullYear()
      logger.info(`🔄 [Cron] Starting automatic aggregator sync for ${year}...`)
      try {
        await autoSync('umk')
        await autoSync('living_cost')
        logger.info(`✅ [Cron] Aggregator sync completed successfully for year ${year}`)
      } catch (err) {
        logger.error(`❌ [Cron] Aggregator sync failed: ${err.message}`)
      }
    },
    { timezone: 'Asia/Jakarta' }
  )
}
