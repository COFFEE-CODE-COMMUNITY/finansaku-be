import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

// === Token Configuration ===
const accessSecret = process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret'
const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret'
const accessExpires = process.env.ACCESS_TOKEN_EXPIRES || '1h'
const refreshExpires = process.env.REFRESH_TOKEN_EXPIRES || '7d'

// === Issue Both Tokens ===
// Generates an access and a refresh token
export const issueTokens = (userId, email = null) => {
  const accessToken = jwt.sign(
    { userId, email },
    accessSecret,
    { expiresIn: accessExpires }
  )

  const refreshToken = jwt.sign(
    { userId },
    refreshSecret,
    { expiresIn: refreshExpires }
  )

  // ✅ return them as two separate strings
  return { accessToken, refreshToken }
}

// === Verify Token ===
export const verifyToken = (token, type = 'access') => {
  const secret = type === 'access' ? accessSecret : refreshSecret
  try {
    return jwt.verify(token, secret)
  } catch {
    throw new Error('Invalid or expired token')
  }
}

export default { issueTokens, verifyToken }
