import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { prisma } from '../config/prisma.js'
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

const sanitizeUser = (user) => {
  if (!user) return null
  const { password, ...safe } = user // eslint-disable-line no-unused-vars
  return safe
}

export const register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body
    if (!email || !password || !name || !username)
      return res.status(422).json({ success: false, message: 'Missing required fields' })

    const result = await authService.registerUser({ name, username, email, password })
    const safeUser = sanitizeUser(result.user)

    const token = crypto.randomBytes(32).toString('hex')
    const verifyKey = `verify:${token}`
    await redis.set(verifyKey, String(result.user.id))
    await redis.expire(verifyKey, 60 * 60 * 24)
    const verifyUrl = `${process.env.CLIENT_VERIFY_URL}?token=${token}`
    await sendVerificationEmail(email, name, verifyUrl)

    const { accessToken, refreshToken } = issueTokens(result.user.id, result.user.email)
    res.cookie('access_token', accessToken, { ...defaultCookieOptions, maxAge: cookieDurations.access })
    res.cookie('refresh_token', refreshToken, { ...defaultCookieOptions, maxAge: cookieDurations.refresh })

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Verification email sent.',
      data: { user: safeUser, accessToken, refreshToken },
    })
  } catch (err) {
    const status = err.statusCode || 400
    res.status(status).json({ success: false, message: err.message || 'Registration failed' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(422).json({ success: false, message: 'Email and password required' })

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
    const status = err.statusCode || 401
    res.status(status).json({ success: false, message: err.message || 'Login failed' })
  }
}

export const me = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' })
    const safeUser = sanitizeUser(req.user)
    res.status(200).json({
      success: true,
      message: 'Authenticated user fetched successfully',
      data: safeUser,
    })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch authenticated user' })
  }
}

export const logout = (_req, res) => {
  try {
    const options = { ...defaultCookieOptions, maxAge: 0 }
    res.clearCookie('access_token', options)
    res.clearCookie('refresh_token', options)
    res.status(200).json({ success: true, message: 'Logged out successfully' })
  } catch {
    res.status(500).json({ success: false, message: 'Failed to logout' })
  }
}

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token
    if (!refreshToken)
      return res.status(401).json({ success: false, message: 'Missing refresh token' })

    const decoded = verifyToken(refreshToken, 'refresh')
    if (!decoded?.userId)
      return res.status(401).json({ success: false, message: 'Invalid refresh token' })

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = issueTokens(decoded.userId)
    res.cookie('access_token', newAccessToken, { ...defaultCookieOptions, maxAge: cookieDurations.access })
    res.cookie('refresh_token', newRefreshToken, { ...defaultCookieOptions, maxAge: cookieDurations.refresh })

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    })
  } catch (err) {
    const status = err.statusCode || 401
    res.status(status).json({ success: false, message: err.message || 'Failed to refresh token' })
  }
}

export const revoke = async (req, res) => {
  try {
    await authService.revokeTokens(req.user.id)
    res.clearCookie('access_token', { ...defaultCookieOptions, maxAge: 0 })
    res.clearCookie('refresh_token', { ...defaultCookieOptions, maxAge: 0 })
    res.status(200).json({ success: true, message: 'All sessions revoked successfully' })
  } catch (err) {
    const status = err.statusCode || 500
    res.status(status).json({ success: false, message: err.message || 'Failed to revoke sessions' })
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query
    const userId = await redis.get(`verify:${token}`)
    if (!userId)
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' })

    await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } })
    await redis.del(`verify:${token}`)

    res.status(200).json({ success: true, message: 'Email verified successfully' })
  } catch (err) {
    const status = err.statusCode || 400
    res.status(status).json({ success: false, message: err.message || 'Failed to verify email' })
  }
}

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    if (user.emailVerifiedAt)
      return res.status(200).json({ success: true, message: 'Email already verified' })

    const token = crypto.randomBytes(32).toString('hex')
    await redis.set(`verify:${token}`, String(user.id))
    await redis.expire(`verify:${token}`, 60 * 60 * 24)
    const verifyUrl = `${process.env.CLIENT_VERIFY_URL}?token=${token}`
    await sendVerificationEmail(email, user.name, verifyUrl)

    res.status(200).json({ success: true, message: 'Verification email resent successfully' })
  } catch (err) {
    const status = err.statusCode || 400
    res.status(status).json({ success: false, message: err.message || 'Failed to resend verification' })
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const token = crypto.randomBytes(32).toString('hex')
    await redis.set(`reset:${token}`, String(email))
    await redis.expire(`reset:${token}`, 60 * 30)
    const resetUrl = `${process.env.CLIENT_RESET_URL}?token=${token}`
    await sendResetPasswordEmail(email, user.name, resetUrl)

    res.status(200).json({ success: true, message: 'Password reset email sent successfully' })
  } catch (err) {
    const status = err.statusCode || 400
    res.status(status).json({ success: false, message: err.message || 'Failed to send password reset email' })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body
    const email = await redis.get(`reset:${token}`)
    if (!email)
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' })

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { email }, data: { password: hashed } })
    await redis.del(`reset:${token}`)

    res.status(200).json({ success: true, message: 'Password reset successfully' })
  } catch (err) {
    const status = err.statusCode || 400
    res.status(status).json({ success: false, message: err.message || 'Failed to reset password' })
  }
}
