import bcrypt from 'bcrypt'
import crypto from 'node:crypto'
import { prisma } from '../config/prisma.js'
import { redis } from '../config/redis.js'
import { sendEmailChangeConfirmation } from '../utils/mailer.js'

// === Update Password ===
// Validates old password and saves a new hashed one
export const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.password) {
    const err = new Error('User not found or password not set')
    err.statusCode = 404
    throw err
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password)
  if (!isMatch) {
    const err = new Error('Current password is incorrect')
    err.statusCode = 400
    throw err
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  })

  return true
}

// === Request Email Change ===
// Sends a confirmation email to the new address
export const requestEmailChange = async (userId, name, newEmail) => {
  const existing = await prisma.user.findUnique({ where: { email: newEmail } })
  if (existing) {
    const err = new Error('Email already in use')
    err.statusCode = 409
    throw err
  }

  const token = crypto.randomBytes(32).toString('hex')
  await redis.set(`emailchange:${token}`, JSON.stringify({ userId, newEmail }))
  await redis.expire(`emailchange:${token}`, 60 * 60 * 24) // 24 hours

  const confirmUrl = `${process.env.CLIENT_EMAIL_CHANGE_URL}?token=${token}`
  await sendEmailChangeConfirmation(newEmail, name, confirmUrl)

  return token
}

// === Confirm Email Change ===
// Updates user's email after confirming via link
export const confirmEmailChange = async (token) => {
  const data = await redis.get(`emailchange:${token}`)
  if (!data) {
    const err = new Error('Invalid or expired token')
    err.statusCode = 400
    throw err
  }

  const { userId, newEmail } = JSON.parse(data)
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      email: newEmail,
      emailVerifiedAt: new Date(),
    },
  })

  await redis.del(`emailchange:${token}`)
  return updatedUser
}
