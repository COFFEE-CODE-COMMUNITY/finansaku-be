import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

// === Token Configuration ===
// Loaded from environment variables
const accessSecret = process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret'
const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret'
const accessExpires = process.env.ACCESS_TOKEN_EXPIRES || '1h'
const refreshExpires = process.env.REFRESH_TOKEN_EXPIRES || '7d'

// === Sign Tokens ===
// Generates both access and refresh tokens for a user
export const signTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    accessSecret,
    { expiresIn: accessExpires }
  )

  const refreshToken = jwt.sign(
    { userId: user.id },
    refreshSecret,
    { expiresIn: refreshExpires }
  )

  return { accessToken, refreshToken }
}

// === Verify Token ===
// Verifies a given token with its corresponding secret
export const verifyToken = (token, type = 'access') => {
  const secret = type === 'access' ? accessSecret : refreshSecret
  try {
    return jwt.verify(token, secret)
  } catch {
    throw new Error('Invalid or expired token')
  }
}

export default { signTokens, verifyToken }
