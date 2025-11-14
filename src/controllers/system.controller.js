import { autoSync } from '../services/aggregator/aggregator.service.js'
import { delCache } from '../utils/cache.js'
import logger from '../config/logger.js'

export const SystemController = {
  async manualSync(req, res) {
    // type: only allow 'umk' or 'living_cost', default to living_cost
    const rawType = req.query.type
    const type = rawType === 'umk' ? 'umk' : 'living_cost'

    const force = req.query.force === 'true'

    // Parse year from query; fall back to current year if invalid/missing
    const yearParam = Number(req.query.year)
    const targetYear = Number.isFinite(yearParam)
      ? yearParam
      : new Date().getFullYear()

    try {
      // Optional: force invalidation of cache for this type + year
      if (force) {
        await delCache(`aggregator:${type}:${targetYear}:*`)
        logger.info(
          `🧩 [System] Force cache invalidation for ${type} ${targetYear}`
        )
      }

      logger.info(
        `🧩 [System] Manual aggregator sync triggered for ${type} (${targetYear})`
      )

      // 👉 Pass targetYear into autoSync
      const result = await autoSync(type, targetYear)
      // result is now: { createdCount, updatedCount, totalProcessed, failedCount }

      if (!result || typeof result !== 'object') {
        return res.status(500).json({
          success: false,
          message: `Aggregator ${type} sync failed: unexpected result from service.`,
        })
      }

      const {
        createdCount = 0,
        updatedCount = 0,
        totalProcessed = 0,
        failedCount = 0,
      } = result

      const unchangedCount =
        totalProcessed - createdCount - updatedCount - failedCount

      // If literally nothing was processed, you might want a softer message
      if (totalProcessed === 0) {
        return res.status(200).json({
          success: true,
          message: `Aggregator ${type} sync completed for year ${targetYear}, but no data was processed.`,
          data: {
            year: targetYear,
            created: createdCount,
            updated: updatedCount,
            unchanged: unchangedCount,
            failed: failedCount,
            totalProcessed,
          },
        })
      }

      return res.status(200).json({
        success: true,
        message: `Aggregator ${type} sync completed successfully for year ${targetYear}.`,
        data: {
          year: targetYear,
          created: createdCount,
          updated: updatedCount,
          unchanged: unchangedCount,
          failed: failedCount,
          totalProcessed,
        },
      })
    } catch (err) {
      const status = err.statusCode || 500
      logger.error(
        `❌ [System] Manual ${type} sync failed for year ${targetYear}: ${err.message}`
      )
      return res.status(status).json({
        success: false,
        message: `Aggregator ${type} sync failed`,
        error: err.message || 'Internal server error',
      })
    }
  },
}
