import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma.js'
import { redis } from '../config/redis.js'
import { sendEmailChangeConfirmation } from '../utils/mailer.js'
import { success, fail } from '../utils/response.js'
import { createLogger } from '../utils/scopedLogger.js'
import * as authService from '../services/auth.service.js'

const log = createLogger('USER')

// === PATCH /user/change-email ===
// Requests an email change and sends a confirmation link to the new email
export const changeEmail = async (req, res, next) => {
  try {
    const { newEmail, password } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    if (!user) return fail(res, 'User not found', 404)

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return fail(res, 'Invalid password', 403)

    const token = crypto.randomBytes(32).toString('hex')
    const key = `email-change:${token}`
    const payload = JSON.stringify({ userId: user.id, newEmail })

    await redis.set(key, payload)
    await redis.expire(key, 60 * 60 * 24) // 24 hours

    const confirmUrl = `${process.env.CLIENT_EMAIL_CHANGE_URL}?token=${token}`
    await sendEmailChangeConfirmation(newEmail, user.name, confirmUrl)

    return success(res, 'Confirmation link sent to new email address', {
      id: user.id,
      oldEmail: user.email,
      newEmail,
      expiresIn: '24 hours',
    })
  } catch (err) {
    log.error('CHANGE EMAIL ERROR', err)
    next(err)
  }
}

// === GET /user/confirm-email-change ===
// Confirms and applies the new email after user clicks confirmation link
export const confirmEmailChange = async (req, res, next) => {
  try {
    const { token } = req.query
    const record = await redis.get(`email-change:${token}`)

    if (!record) return fail(res, 'Invalid or expired token', 400)

    const { userId, newEmail } = JSON.parse(record)

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
    next(err)
  }
}

// === PATCH /user/change-password ===
// Updates user's password after verifying current password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    if (!user) return fail(res, 'User not found', 404)

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return fail(res, 'Invalid current password', 403)

    const hashed = await bcrypt.hash(newPassword, 10)
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed, updatedAt: new Date() },
    })

    // Invalidate all sessions (logout from all devices)
    await authService.revokeTokens(req.user.id)

    return success(res, 'Password changed successfully', {
      id: updated.id,
      email: updated.email,
      updatedAt: updated.updatedAt,
    })
  } catch (err) {
    log.error('CHANGE PASSWORD ERROR', err)
    next(err)
  }
}
