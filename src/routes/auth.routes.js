import express from 'express'
import { register, login, me, logout, refresh } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = express.Router()

// === Public Routes ===
router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)

// === Protected Routes ===
router.get('/me', authenticate, me)
router.post('/logout', authenticate, logout)

export default router