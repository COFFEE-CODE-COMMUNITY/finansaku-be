import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { changeEmail, confirmEmailChange, changePassword } from '../controllers/user.controller.js'

const router = Router()

router.patch('/change-email', authenticate, changeEmail)
router.get('/confirm-email-change', confirmEmailChange)
router.patch('/change-password', authenticate, changePassword)

export default router
