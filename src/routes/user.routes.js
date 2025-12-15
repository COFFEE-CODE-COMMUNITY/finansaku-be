import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import {
  changeEmail,
  changePassword,
} from '../controllers/user.controller.js'

const router = Router()

// === PATCH /api/v1/user/change-email ===
// Sends confirmation link to new email
router.patch('/change-email', authenticate, changeEmail)

// === PATCH /api/v1/user/change-password ===
// Changes current password with verification
router.patch('/change-password', authenticate, changePassword)

export default router
