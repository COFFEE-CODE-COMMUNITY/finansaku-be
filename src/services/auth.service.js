import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { signTokens } from '../utils/jwt.js'

const prisma = new PrismaClient()

// === Register New User ===
export async function registerUser({ name, username, email, password }) {
  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('Email already registered')

  // Hash password securely
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user record
  const user = await prisma.user.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
    },
    include: { city: true, template: true },
  })

  // Generate both tokens once
  const { accessToken, refreshToken } = signTokens({ userId: user.id })

  // Store only refresh token in DB (not access)
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  })

  return { user, accessToken, refreshToken }
}

// === Authenticate User Login ===
export async function loginUser({ email, password }) {
  // Find user
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password) throw new Error('Invalid email or password')

  // Verify password
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new Error('Invalid email or password')

  // Generate both tokens once
  const { accessToken, refreshToken } = signTokens({ userId: user.id })

  // Store only refresh token in DB
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
    where: { userId },
    data: { revoked: true },
  })
  return true
}
