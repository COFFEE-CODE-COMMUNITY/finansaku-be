import express from 'express'
import { getUserDashboard } from '../controllers/dashboard.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/me', authenticate, getUserDashboard)

export default router
