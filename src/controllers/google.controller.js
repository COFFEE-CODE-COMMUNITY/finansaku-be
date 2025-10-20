import crypto from 'node:crypto'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import { GoogleProfileDto } from '../dto/google-profile.dto.js'
import { signTokens } from '../utils/jwt.js'
import { defaultCookieOptions } from '../config/cookieOptions.js'

// === Google OAuth2 Constants ===
// OAuth2 endpoints for authentication and user info
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

// === Redirect Handler ===
// Send user to Google's consent screen
export const googleRedirect = (req, res) => {
  const state = crypto.randomBytes(16).toString('hex')

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state
  })

  res.redirect(`${GOOGLE_AUTH_URL}?${params}`)
}

// === Callback Handler ===
// Handle Google's callback and exchange code for tokens
export const googleCallback = async (req, res) => {
  const { code } = req.query
  if (!code) return res.status(400).json({ error: 'Missing authorization code' })

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    })

    const tokens = await tokenRes.json()
    if (!tokens.access_token) {
      return res.status(400).json({ error: 'Failed to retrieve Google tokens' })
    }

    // Fetch user profile from Google
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    })
    const profile = await profileRes.json()
    if (!profile.email || !profile.name) {
      return res.status(400).json({ error: 'Invalid Google profile data' })
    }

    // Create DTO for structured data
    const profileData = new GoogleProfileDto(profile)

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { email: profileData.email },
      update: {
        name: profileData.name,
        profileImage: profileData.picture,
        emailVerifiedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        email: profile.email,
        name: profile.name,
        username: profile.email.split('@')[0],
        profileImage: profile.picture,
        emailVerifiedAt: new Date(),
        provider: 'google',
        providerId: profile.id || profile.sub
      }
    })

    // Generate JWT access and refresh tokens
    const { accessToken, refreshToken } = await signTokens(user)

    // Send refresh token as cookie and redirect
    res
      .cookie('refreshToken', refreshToken, defaultCookieOptions)
      .redirect(`${process.env.CLIENT_WEB_REDIRECT}?token=${accessToken}`)

  } catch (error) {
    console.error('Google OAuth error:', error)
    res.status(500).json({ error: 'OAuth authentication failed' })
  }
}
