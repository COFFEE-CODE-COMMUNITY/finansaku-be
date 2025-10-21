import express from 'express'
import { register, login, me, logout, refresh, revoke } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { googleRedirect, googleCallback } from '../controllers/google.controller.js'

const router = express.Router()

// === Public Routes ===
router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)

// === Protected Routes ===
router.get('/me', authenticate, me)
router.post('/logout', authenticate, logout)
router.post('/revoke', authenticate, revoke)

// === Google OAuth2 Routes ===
router.get('/google', googleRedirect)
router.get('/google/callback', googleCallback)

export default router
