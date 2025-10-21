import crypto from 'node:crypto'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import { GoogleProfileDto } from '../dto/google-profile.dto.js'
import { signTokens } from '../utils/jwt.js'
import { defaultCookieOptions } from '../config/cookieOptions.js'
import { createLogger } from '../utils/scopedLogger.js'

const log = createLogger('OAUTH')

// === Google OAuth2 Constants ===
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

// === Development State Store (for localhost only) ===
const devStateStore = new Map()

// === Redirect Handler ===
// Redirect user to Google's consent screen
export const googleRedirect = (req, res, next) => {
  try {
    const state = crypto.randomUUID()
    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction) {
      res.cookie('oauth_state', state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 5 * 60 * 1000,
      })
    } else {
      devStateStore.set(state, Date.now())
      setTimeout(() => devStateStore.delete(state), 5 * 60 * 1000)
    }

    const redirectUrl =
      GOOGLE_AUTH_URL +
      '?' +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        state,
      }).toString()

    log.info('[GOOGLE OAUTH] Redirecting user', {
      env: process.env.NODE_ENV,
      usingCookie: isProduction,
      state,
    })

    res.redirect(redirectUrl)
  } catch (err) {
    next(err)
  }
}

// === Callback Handler ===
// Handle Google's callback and exchange code for tokens
export const googleCallback = async (req, res, next) => {
  try {
    const { state, code } = req.query
    const stateCookie = req.cookies.oauth_state
    const isProduction = process.env.NODE_ENV === 'production'

    // === Validate OAuth state ===
    const valid = isProduction
      ? stateCookie && state === stateCookie
      : devStateStore.has(state)

    if (!valid) {
      const error = new Error('Invalid OAuth state')
      error.statusCode = 400
      throw error
    }

    // Cleanup stored state
    if (isProduction) res.clearCookie('oauth_state')
    else devStateStore.delete(state)

    if (!code) {
      const error = new Error('Missing authorization code')
      error.statusCode = 400
      throw error
    }

    // === Exchange code for access token ===
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      log.error('[GOOGLE OAUTH] Token exchange failed', errText)
      const error = new Error('Failed to exchange token with Google')
      error.statusCode = 400
      throw error
    }

    const tokens = await tokenRes.json()
    if (!tokens.access_token) {
      const error = new Error('Access token not received from Google')
      error.statusCode = 400
      throw error
    }

    // === Fetch user profile ===
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!profileRes.ok) {
      const errText = await profileRes.text()
      log.error('[GOOGLE OAUTH] Profile fetch failed', errText)
      const error = new Error('Failed to fetch Google profile')
      error.statusCode = 400
      throw error
    }

    const profile = await profileRes.json()
    if (!profile.email) {
      const error = new Error('Google profile missing email')
      error.statusCode = 400
      throw error
    }

    // === Upsert user ===
    const data = new GoogleProfileDto(profile)
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        profileImage: data.picture,
        emailVerifiedAt: new Date(),
        provider: 'google',
        providerId: data.sub || data.id,
      },
      create: {
        id: crypto.randomUUID(),
        email: data.email,
        name: data.name,
        username: data.email.split('@')[0],
        profileImage: data.picture,
        emailVerifiedAt: new Date(),
        provider: 'google',
        providerId: data.sub || data.id,
      },
    })

    // === Generate tokens ===
    const { accessToken, refreshToken } = await signTokens(user)

    // === Set cookie and redirect ===
    res.cookie('refreshToken', refreshToken, {
      ...defaultCookieOptions,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    })

    log.info('[GOOGLE OAUTH] User logged in', { email: user.email })
    return res.redirect(`${process.env.CLIENT_WEB_REDIRECT}?token=${accessToken}`)
  } catch (err) {
    log.error('GOOGLE OAUTH ERROR', err)
    err.statusCode = err.statusCode || 500
    next(err)
  }
}
