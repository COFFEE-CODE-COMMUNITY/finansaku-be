import express from 'express'
import { submitSurvey, getMySurvey, getSurveyHistory } from '../controllers/survey.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'


const router = express.Router()

// POST /api/v1/survey/submit
router.post('/submit', authenticate, submitSurvey)
router.get('/me', authenticate, getMySurvey) 
router.get('/history', authenticate, getSurveyHistory)
  
export default router