import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// === Authentication Middleware ===
// Verifies JWT from cookie or Authorization header
export const authenticate = async (req, res, next) => {
  // Extract token from either cookie or Authorization header
  const token =
    req.cookies?.access_token ||
    req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: missing token' })
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    // Ensure payload structure is valid
    if (!decoded || typeof decoded !== 'object' || typeof decoded.userId !== 'string') {
      return res.status(401).json({ error: 'Invalid token payload' })
    }

    // Find the user associated with the token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Attach user object to request for downstream handlers
    req.user = user
    next()
  } catch (err) {
    console.error('[AUTH ERROR]', err)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
