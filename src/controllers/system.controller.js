import { autoSync } from '../services/aggregator/aggregator.service.js'
import { delCache } from '../utils/cache.js'
import logger from '../config/logger.js'

export const SystemController = {
  async manualSync(req, res) {
    const type = req.query.type || 'living_cost'
    const force = req.query.force === 'true'
    const year = Number(req.query.year) || new Date().getFullYear()

    try {
      if (force) {
        await delCache(`aggregator:${type}:${year}:*`)
        logger.info(`🧩 [System] Force cache invalidation for ${type} ${year}`)
      }

      logger.info(`🧩 [System] Manual aggregator sync triggered for ${type}`)
      
      // 1. Capture the result from the autoSync service
      const result = await autoSync(type)

      // 2. Check the result to provide a better message
      if (!result) {
        // This happens if the UMK .json file was missing
        return res
          .status(404)
          .json({ success: false, message: `Aggregator ${type} sync failed: Source file or data not found.` })
      }

      if (Array.isArray(result) && result.length === 0) {
        // This happens if the file was found but was empty
        return res
          .status(200)
          .json({ success: true, message: `Aggregator ${type} sync completed, but no new data was processed.` })
      }

      // 3. If data was processed, return the count
      return res
        .status(200)
        .json({ 
          success: true, 
          message: `Aggregator ${type} sync completed successfully.`,
          data: {
            recordsProcessed: result.length
          }
        })
    } catch (err) {
      const status = err.statusCode || 500
      logger.error(`❌ [System] Manual ${type} sync failed: ${err.message}`)
      return res.status(status).json({
        success: false,
        message: `Aggregator ${type} sync failed`,
        error: err.message || 'Internal server error',
      })
    }
  },
}