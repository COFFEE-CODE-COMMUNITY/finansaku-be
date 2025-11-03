import bcrypt from 'bcrypt'
import { prisma } from '../config/prisma.js'
import { issueTokens } from '../utils/jwt.js'
import { generateToken, consumeToken } from '../utils/tokenCache.js'
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from './mail.service.js'

// === Register New User ===
export async function registerUser({ name, username, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('Email already registered')

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { name, username, email, password: hashedPassword },
    include: { city: true, template: true },
  })

  // Generate proper tokens
  const { accessToken, refreshToken } = issueTokens(user.id, user.email)

  // Store refresh token as string (not object)
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return { user, accessToken, refreshToken }
}

// === Authenticate User Login ===
export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password) throw new Error('Invalid email or password')

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new Error('Invalid email or password')

  const { accessToken, refreshToken } = issueTokens(user.id, user.email)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return { user, accessToken, refreshToken }
}

// === Revoke All Refresh Tokens for a User ===
export async function revokeTokens(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  })
  return true
}

// === Send Verification Email ===
export async function sendEmailVerification(user) {
  const token = await generateToken('verify', user.id)
  const verifyUrl = `${process.env.CLIENT_WEB_REDIRECT}/verify-email?token=${token}`
  await sendVerificationEmail(user.email, user.name, verifyUrl)
  return token
}

// === Verify Email Token ===
export async function verifyEmailToken(token) {
  const userId = await consumeToken('verify', token)
  if (!userId) throw new Error('Invalid or expired token')

  return await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  })
}

// === Send Password Reset Email ===
export async function sendPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Email not found')

  const token = await generateToken('reset', user.id)
  const resetUrl = `${process.env.CLIENT_WEB_REDIRECT}/reset-password?token=${token}`
  await sendResetPasswordEmail(user.email, user.name, resetUrl)
  return token
}

// === Reset Password ===
export async function resetPassword(token, newPassword) {
  const userId = await consumeToken('reset', token)
  if (!userId) throw new Error('Invalid or expired token')

  const hashed = await bcrypt.hash(newPassword, 10)
  return await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  })
}
