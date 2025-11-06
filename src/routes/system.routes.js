import express from 'express'
import { SystemController } from '../controllers/system.controller.js'

const router = express.Router()

// === System Routes ===
// Aggregator manual trigger (GET /api/v1/system/aggregator/sync?type=umk|living_cost)
// Used by admin or cron to force re-sync data from external sources
router.get('/system/aggregator/sync', SystemController.manualSync)

export default router
