import { autoSync } from '../services/aggregator/aggregator.service.js'
import logger from '../config/logger.js'

export const SystemController = {
  async manualSync(req, res) {
    const type = req.query.type || 'living_cost' // or umk
    try {
      logger.info(`🧩 [System] Manual aggregator sync triggered for ${type}`)
      await autoSync(type)
      return res.status(200).json({ success: true, message: `Aggregator ${type} sync completed` })
    } catch (err) {
      logger.error(`❌ [System] Manual ${type} sync failed: ${err.message}`)
      return res.status(500).json({ success: false, message: 'Aggregator sync failed', error: err.message })
    }
  },
}
