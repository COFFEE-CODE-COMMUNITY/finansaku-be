import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma.js'
import { redis } from '../config/redis.js'
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
} from '../utils/mailer.js'
import * as authService from '../services/auth.service.js'
import { defaultCookieOptions, cookieDurations } from '../config/cookieOptions.js'
import { verifyToken, issueTokens } from '../utils/jwt.js'
import { createLogger } from '../utils/scopedLogger.js'

const log = createLogger('AUTH')

// === Helper: sanitize user (never expose password) ===
const sanitizeUser = (user) => {
  if (!user) return null
  // eslint-disable-next-line no-unused-vars
  const { password, ...safe } = user
  return safe
}

// === POST /auth/register ===
export const register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body
    const result = await authService.registerUser({ name, username, email, password })

    // remove password before sending back
    const safeUser = sanitizeUser(result.user)

    // === Send verification email ===
    const token = crypto.randomBytes(32).toString('hex')
    const verifyKey = `verify:${token}`
    await redis.set(verifyKey, String(result.user.id))
    await redis.expire(verifyKey, 60 * 60 * 24) // 24h
    const verifyUrl = `${process.env.CLIENT_VERIFY_URL}?token=${token}`
    await sendVerificationEmail(email, name, verifyUrl)

    // === Tokens ===
    const { accessToken, refreshToken } = issueTokens(result.user.id, result.user.email)
    res.cookie('access_token', accessToken, { ...defaultCookieOptions, maxAge: cookieDurations.access })
    res.cookie('refresh_token', refreshToken, { ...defaultCookieOptions, maxAge: cookieDurations.refresh })

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Verification email sent.',
      data: { user: safeUser, accessToken, refreshToken },
    })
  } catch (err) {
    next(err)
  }
}

// === POST /auth/login ===
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const { user, accessToken, refreshToken } = await authService.loginUser({ email, password })
    if (!user.emailVerifiedAt) log.warn(`User ${email} logged in without verified email`)

    res.cookie('access_token', accessToken, { ...defaultCookieOptions, maxAge: cookieDurations.access })
    res.cookie('refresh_token', refreshToken, { ...defaultCookieOptions, maxAge: cookieDurations.refresh })

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: sanitizeUser(user) },
    })
  } catch (err) {
    err.statusCode = err.statusCode || 401
    next(err)
  }
}

// === GET /auth/me ===
export const me = async (req, res) => {
  const safeUser = sanitizeUser(req.user)
  res.status(200).json({
    success: true,
    message: 'Authenticated user fetched successfully',
    data: safeUser,
  })
}

// === POST /auth/logout ===
export const logout = (_req, res) => {
  const options = { ...defaultCookieOptions, maxAge: 0 }
  res.clearCookie('access_token', options)
  res.clearCookie('refresh_token', options)
  res.status(200).json({ success: true, message: 'Logged out successfully' })
}

// === POST /auth/refresh ===
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token
    if (!refreshToken) throw Object.assign(new Error('Missing refresh token'), { statusCode: 401 })
    const decoded = verifyToken(refreshToken, 'refresh')
    if (!decoded?.userId) throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 })

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = issueTokens(decoded.userId)
    res.cookie('access_token', newAccessToken, { ...defaultCookieOptions, maxAge: cookieDurations.access })
    res.cookie('refresh_token', newRefreshToken, { ...defaultCookieOptions, maxAge: cookieDurations.refresh })

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    })
  } catch (err) {
    log.error('REFRESH ERROR', err)
    err.statusCode = err.statusCode || 401
    next(err)
  }
}

// === POST /auth/revoke ===
export const revoke = async (req, res, next) => {
  try {
    await authService.revokeTokens(req.user.id)
    res.clearCookie('access_token', { ...defaultCookieOptions, maxAge: 0 })
    res.clearCookie('refresh_token', { ...defaultCookieOptions, maxAge: 0 })
    res.status(200).json({ success: true, message: 'All sessions revoked successfully' })
  } catch (err) {
    log.error('[AUTH REVOKE ERROR]', err)
    err.statusCode = 500
    next(err)
  }
}

// === GET /auth/verify-email ===
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query
    const userId = await redis.get(`verify:${token}`)
    if (!userId) throw Object.assign(new Error('Invalid or expired verification token'), { statusCode: 400 })

    await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } })
    await redis.del(`verify:${token}`)

    res.status(200).json({ success: true, message: 'Email verified successfully' })
  } catch (err) {
    next(err)
  }
}

// === POST /auth/resend-verification ===
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 })
    if (user.emailVerifiedAt) return res.status(200).json({ success: true, message: 'Email already verified' })

    const token = crypto.randomBytes(32).toString('hex')
    await redis.set(`verify:${token}`, String(user.id))
    await redis.expire(`verify:${token}`, 60 * 60 * 24)
    const verifyUrl = `${process.env.CLIENT_VERIFY_URL}?token=${token}`
    await sendVerificationEmail(email, user.name, verifyUrl)

    res.status(200).json({ success: true, message: 'Verification email resent successfully' })
  } catch (err) {
    next(err)
  }
}

// === POST /auth/forgot-password ===
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 })

    const token = crypto.randomBytes(32).toString('hex')
    await redis.set(`reset:${token}`, String(email))
    await redis.expire(`reset:${token}`, 60 * 30)
    const resetUrl = `${process.env.CLIENT_RESET_URL}?token=${token}`
    await sendResetPasswordEmail(email, user.name, resetUrl)

    res.status(200).json({ success: true, message: 'Password reset email sent successfully' })
  } catch (err) {
    next(err)
  }
}

// === POST /auth/reset-password ===
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body
    const email = await redis.get(`reset:${token}`)
    if (!email) throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 })

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { email }, data: { password: hashed } })
    await redis.del(`reset:${token}`)

    res.status(200).json({ success: true, message: 'Password reset successfully' })
  } catch (err) {
    next(err)
  }
}
