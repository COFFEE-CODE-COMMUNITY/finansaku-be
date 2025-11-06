import express from 'express'
import { getHistory } from '../controllers/history.controller.js'

const router = express.Router()

// GET /api/v1/history?type=income|expense&limit=10&page=1
router.get('/', getHistory)

export default router
