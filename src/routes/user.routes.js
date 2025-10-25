import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import {
  changeEmail,
  confirmEmailChange,
  changePassword,
} from '../controllers/user.controller.js'

const router = Router()

// === PATCH /api/v1/user/change-email ===
// Sends confirmation link to new email
router.patch('/change-email', authenticate, changeEmail)

// === GET /api/v1/user/confirm-email-change ===
// Confirms new email via token
router.get('/confirm-email-change', confirmEmailChange)

// === PATCH /api/v1/user/change-password ===
// Changes current password with verification
router.patch('/change-password', authenticate, changePassword)

export default router
