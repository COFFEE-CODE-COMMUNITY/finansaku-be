import * as authService from '../services/auth.service.js'
import { verifyToken, signTokens } from '../utils/jwt.js'
import { defaultCookieOptions, cookieDurations } from '../config/cookieOptions.js'
import { createLogger } from '../utils/scopedLogger.js'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma.js'
import { redis } from '../config/redis.js'
import { sendResetPasswordEmail, sendVerificationEmail } from '../utils/mailer.js'

const log = createLogger('AUTH')

// === POST /auth/register ===
// Registers a new user and returns token cookie
export const register = async (req, res, next) => {
  try {
    const { name, username, email, password, cityId, templateId } = req.body

    if (!cityId || !templateId) {
      const error = new Error('cityId and templateId are required')
      error.statusCode = 400
      throw error
    }

    const result = await authService.registerUser({
      name,
      username,
      email,
      password,
      cityId,
      templateId,
    })

    // === Send verification email ===
    const token = crypto.randomBytes(32).toString('hex')
    await redis.set(`verify:${token}`, result.id, { EX: 60 * 60 * 24 }) // 24h
    const verifyUrl = `${process.env.CLIENT_WEB_REDIRECT}/verify-email?token=${token}`
    await sendVerificationEmail(email, verifyUrl)

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

// === POST /auth/login ===
// Authenticates user and issues both access & refresh token cookies
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const { user, accessToken, refreshToken } = await authService.loginUser({ email, password })

    if (!user.emailVerified) {
      const error = new Error('Please verify your email before logging in')
      error.statusCode = 403
      throw error
    }

    res.cookie('access_token', accessToken, {
      ...defaultCookieOptions,
      maxAge: cookieDurations.access,
    })

    res.cookie('refresh_token', refreshToken, {
      ...defaultCookieOptions,
      maxAge: cookieDurations.refresh,
    })

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user },
    })
  } catch (err) {
    err.statusCode = err.statusCode || 401
    next(err)
  }
}

// === GET /auth/me ===
// Returns authenticated user info
export const me = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authenticated user fetched successfully',
    data: {
      id: req.user.id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
      cityId: req.user.cityId,
      templateId: req.user.templateId,
    },
  })
}

// === POST /auth/logout ===
// Clears both JWT cookies
export const logout = (_req, res) => {
  const options = {
    ...defaultCookieOptions,
    maxAge: 0,
  }

  res.clearCookie('access_token', options)
  res.clearCookie('refresh_token', options)

  res.status(200).json({ success: true, message: 'Logged out successfully' })
}

// === POST /auth/refresh ===
// Refreshes the access token using the refresh token
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token
    if (!refreshToken) {
      const error = new Error('Missing refresh token')
      error.statusCode = 401
      throw error
    }

    const decoded = verifyToken(refreshToken)
    if (!decoded || typeof decoded !== 'object' || typeof decoded.userId !== 'string') {
      const error = new Error('Invalid refresh token')
      error.statusCode = 401
      throw error
    }

    // Token rotation
    const newAccessToken = signTokens({ userId: decoded.userId })
    const newRefreshToken = signTokens({ userId: decoded.userId })

    res.cookie('access_token', newAccessToken, {
      ...defaultCookieOptions,
      maxAge: cookieDurations.access,
    })

    res.cookie('refresh_token', newRefreshToken, {
      ...defaultCookieOptions,
      maxAge: cookieDurations.refresh,
    })

    res.status(200).json({ success: true, message: 'Token refreshed successfully' })
  } catch (err) {
    log.error('REFRESH ERROR', err)
    err.statusCode = err.statusCode || 401
    next(err)
  }
}

// === POST /auth/revoke ===
// Revokes all refresh tokens for the current user
export const revoke = async (req, res, next) => {
  try {
    await authService.revokeTokens(req.user.id)

    res.clearCookie('access_token', { ...defaultCookieOptions, maxAge: 0 })
    res.clearCookie('refresh_token', { ...defaultCookieOptions, maxAge: 0 })

    res.status(200).json({
      success: true,
      message: 'All sessions revoked successfully',
    })
  } catch (err) {
    log.error('[AUTH REVOKE ERROR]', err)
    err.statusCode = 500
    next(err)
  }
}

// === GET /auth/verify-email ===
// Verifies user's email using token
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query
    const userId = await redis.get(`verify:${token}`)
    if (!userId) {
      const error = new Error('Invalid or expired verification token')
      error.statusCode = 400
      throw error
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    })

    await redis.del(`verify:${token}`)

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    })
  } catch (err) {
    next(err)
  }
}

// === POST /auth/resend-verification ===
// Resends verification email for unverified users
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      const error = new Error('User not found')
      error.statusCode = 404
      throw error
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified',
      })
    }

    const token = crypto.randomBytes(32).toString('hex')
    await redis.set(`verify:${token}`, user.id, { EX: 60 * 60 * 24 })
    const verifyUrl = `${process.env.CLIENT_WEB_REDIRECT}/verify-email?token=${token}`
    await sendVerificationEmail(email, verifyUrl)

    res.status(200).json({
      success: true,
      message: 'Verification email resent successfully',
    })
  } catch (err) {
    next(err)
  }
}

// === POST /auth/forgot-password ===
// Sends password reset email with secure token
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      const error = new Error('User not found')
      error.statusCode = 404
      throw error
    }

    const token = crypto.randomBytes(32).toString('hex')
    await redis.set(`reset:${token}`, email, { EX: 60 * 30 }) // 30 min expiry
    const resetUrl = `${process.env.CLIENT_WEB_REDIRECT}/reset-password?token=${token}`
    await sendResetPasswordEmail(email, resetUrl)

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
    })
  } catch (err) {
    next(err)
  }
}

// === POST /auth/reset-password ===
// Resets user's password using valid token
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body
    const email = await redis.get(`reset:${token}`)

    if (!email) {
      const error = new Error('Invalid or expired reset token')
      error.statusCode = 400
      throw error
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { email }, data: { password: hashed } })
    await redis.del(`reset:${token}`)

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    })
  } catch (err) {
    next(err)
  }
}
