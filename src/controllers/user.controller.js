import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma.js'
import { redis } from '../config/redis.js'
import { sendEmailChangeConfirmation } from '../utils/mailer.js'
import { success, fail } from '../utils/response.js'
import { createLogger } from '../utils/scopedLogger.js'
import { authService } from '../services/auth.service.js' // reuse revokeTokens

const log = createLogger('USER')

// === PATCH /user/change-email ===
export const changeEmail = async (req, res, next) => {
  try {
    const { newEmail, password } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    if (!user) return fail(res, 'User not found', 404)

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return fail(res, 'Invalid password', 403)

    const token = crypto.randomBytes(32).toString('hex')
    await redis.set(`email-change:${token}`, JSON.stringify({ userId: user.id, newEmail }), { EX: 60 * 60 * 24 })

    const confirmUrl = `${process.env.CLIENT_WEB_REDIRECT}/confirm-email-change?token=${token}`
    await sendEmailChangeConfirmation(newEmail, confirmUrl)

    return success(res, 'Confirmation link sent to new email address')
  } catch (err) {
    log.error('CHANGE EMAIL ERROR', err)
    next(err)
  }
}

// === GET /user/confirm-email-change ===
export const confirmEmailChange = async (req, res, next) => {
  try {
    const { token } = req.query
    const record = await redis.get(`email-change:${token}`)
    if (!record) return fail(res, 'Invalid or expired token', 400)

    const { userId, newEmail } = JSON.parse(record)
    await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail, emailVerified: true },
    })

    await redis.del(`email-change:${token}`)

    return success(res, 'Email address updated successfully')
  } catch (err) {
    log.error('CONFIRM EMAIL CHANGE ERROR', err)
    next(err)
  }
}

// === PATCH /user/change-password ===
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    if (!user) return fail(res, 'User not found', 404)

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return fail(res, 'Invalid current password', 403)

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } })

    // Invalidate all sessions
    await authService.revokeTokens(req.user.id)

    return success(res, 'Password changed successfully')
  } catch (err) {
    log.error('CHANGE PASSWORD ERROR', err)
    next(err)
  }
}
