import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

// === Token Configuration ===
const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-secret'
const expiresIn = process.env.ACCESS_TOKEN_EXPIRES || '1h'

// === Sign JWT Token ===
export const signToken = (payload) => {
  // Signs the given payload and returns a JWT string
  return jwt.sign(payload, secret, /** @type {import('jsonwebtoken').SignOptions} */ ({ expiresIn }))
}

// === Verify JWT Token ===
export const verifyToken = (token) => {
  try {
    // Verifies the given token and returns its decoded payload
    return jwt.verify(token, secret)
  } catch {
    throw new Error('Invalid or expired token')
  }
}

export default { signToken, verifyToken }
