import { autoSync } from '../services/aggregator/aggregator.service.js'
import logger from '../config/logger.js'

export const SystemController = {
  async manualSync(req, res) {
    const type = req.query.type || 'living_cost'
    try {
      logger.info(`🧩 [System] Manual aggregator sync triggered for ${type}`)
      await autoSync(type)
      return res.status(200).json({ success: true, message: `Aggregator ${type} sync completed` })
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
