import cron from 'node-cron'
import logger from '../config/logger.js'
import { aggregatorService } from '../services/aggregator/aggregator.service.js'

const enabled = process.env.AGGREGATOR_ENABLE_CRON === 'true'
const expr = process.env.AGGREGATOR_CRON_EXPRESSION || '0 3 1 * *'

export function registerAggregatorCron() {
  if (!enabled) {
    logger.info('[AggregatorCron] disabled')
    return
  }
  cron.schedule(expr, async () => {
    try {
      const year = new Date().getFullYear()
      logger.info(`[AggregatorCron] start year=${year}`)
      await aggregatorService.manualSync({ type: 'umk', year })
      await aggregatorService.manualSync({ type: 'living_cost', year })
      logger.info('[AggregatorCron] done')
    } catch (err) {
      logger.error(`[AggregatorCron] error ${err.message}`)
    }
  }, { timezone: 'Asia/Jakarta' })
}
