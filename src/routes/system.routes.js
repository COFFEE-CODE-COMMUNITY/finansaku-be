import express from 'express'
import { SystemController } from '../controllers/system.controller.js'

const router = express.Router()

// === System Routes ===
// Aggregator manual trigger (GET /system/aggregator/sync?type=umk|living_cost)
router.get('/aggregator/sync', SystemController.manualSync)

export default router
