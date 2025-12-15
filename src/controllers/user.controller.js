import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { prisma } from '../config/prisma.js'
import { redis } from '../config/redis.js'
import { sendEmailChangeConfirmation } from '../utils/mailer.js'
import { success, fail } from '../utils/response.js'
import { createLogger } from '../utils/scopedLogger.js'
import * as authService from '../services/auth.service.js'

const log = createLogger('USER')

// === PATCH /user/change-email ===
// Requests an email change and sends a confirmation link to the new email
export const changeEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body

    if (!newEmail || !password)
      return fail(res, 'New email and password are required', 422)

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) return fail(res, 'User not found', 404)

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return fail(res, 'Invalid password', 403)

    const token = crypto.randomBytes(32).toString('hex')
    const key = `email-change:${token}`
    const payload = JSON.stringify({ userId: user.id, newEmail })

    await redis.set(key, payload)
    await redis.expire(key, 60 * 60 * 24) // 24 hours

    const baseUrl = `${req.protocol}://${req.get('host')}`
    const confirmUrl = `${baseUrl}/api/v1/user/confirm-email-change?token=${token}`

    await sendEmailChangeConfirmation(newEmail, user.name, confirmUrl, baseUrl)

    return success(res, 'Confirmation link sent to new email address', {
      id: user.id,
      oldEmail: user.email,
      newEmail,
      expiresIn: '24 hours',
    })
  } catch (err) {
    log.error('CHANGE EMAIL ERROR', err)
    const status = err.statusCode || 500
    return fail(res, err.message || 'Failed to request email change', status)
  }
}

// === GET /user/confirm-email-change ===
// Confirms and applies the new email after user clicks confirmation link
export const confirmEmailChange = async (req, res) => {
  try {
    const { token } = req.query
    if (!token) return fail(res, 'Missing token', 422)

    const record = await redis.get(`email-change:${token}`)
    if (!record) return fail(res, 'Invalid or expired token', 400)

    const { userId, newEmail } = JSON.parse(record)
    if (!userId || !newEmail)
      return fail(res, 'Invalid token payload', 400)

    const existing = await prisma.user.findUnique({ where: { email: newEmail } })
    if (existing) return fail(res, 'Email already in use', 409)

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    await redis.del(`email-change:${token}`)

    return success(res, 'Email address updated successfully', {
      id: updated.id,
      email: updated.email,
      emailVerifiedAt: updated.emailVerifiedAt,
      updatedAt: updated.updatedAt,
    })
  } catch (err) {
    log.error('CONFIRM EMAIL CHANGE ERROR', err)
    const status = err.statusCode || 500
    return fail(res, err.message || 'Failed to confirm email change', status)
  }
}

// === PATCH /user/change-password ===
// Updates user's password after verifying current password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword)
      return fail(res, 'Both current and new passwords are required', 422)

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) return fail(res, 'User not found', 404)

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return fail(res, 'Invalid current password', 403)

    if (currentPassword === newPassword)
      return fail(res, 'New password must be different from the current one', 400)

    const hashed = await bcrypt.hash(newPassword, 10)
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed, updatedAt: new Date() },
    })

    await authService.revokeTokens(req.user.id)

    return success(res, 'Password changed successfully', {
      id: updated.id,
      email: updated.email,
      updatedAt: updated.updatedAt,
    })
  } catch (err) {
    log.error('CHANGE PASSWORD ERROR', err)
    const status = err.statusCode || 500
    return fail(res, err.message || 'Failed to change password', status)
  }
}
