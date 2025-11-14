import { Router } from 'express'
import { getRecommendedBudget } from '../controllers/budget.controller.js'

const router = Router()

// === Route to fetch recommended budget for a user ===
router.get('/recommended', getRecommendedBudget)

export default router
