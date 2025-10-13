import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { signToken } from '../utils/jwt.js'

const prisma = new PrismaClient()

// === Register New User ===
export async function registerUser({ name, username, email, password, cityId, templateId }) {
  // Check if the email is already registered
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('Email already registered')

  // Hash the password for security
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create the user record
  const user = await prisma.user.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
      city: { connect: { id: cityId } },
      template: { connect: { id: templateId } },
    },
    include: { city: true, template: true },
  })

  // Generate tokens for the newly registered user
  const accessToken = signToken({ userId: user.id })
  const refreshToken = signToken({ userId: user.id })

  // Store the refresh token in the database
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
  // Find the user by email
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Invalid email or password')

  // Compare hashed password
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new Error('Invalid email or password')

  // Generate new tokens
  const accessToken = signToken({ userId: user.id })
  const refreshToken = signToken({ userId: user.id })

  // Store the refresh token for session tracking
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return { user, accessToken, refreshToken }
}
