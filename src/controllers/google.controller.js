import crypto from 'node:crypto'
import { prisma } from '../config/prisma.js'
import { issueTokens } from '../utils/jwt.js'
import { defaultCookieOptions } from '../config/cookieOptions.js'
import { createLogger } from '../utils/scopedLogger.js'
import config from '../config/index.js'

const log = createLogger('OAUTH')

// === Google OAuth2 Config ===
const GOOGLE_AUTH_URL = config.OAUTH2_ENDPOINT_GOOGLE
const GOOGLE_TOKEN_URL = config.GOOGLE_TOKEN_URL
const GOOGLE_USERINFO_URL = config.GOOGLE_USERINFO_URL

const devStateStore = new Map()

// === Step 1: Redirect user to Google OAuth ===
export const googleRedirect = (req, res) => {
  try {
    const state = crypto.randomUUID()
    const isProduction = config.NODE_ENV === 'production'

    if (isProduction) {
      res.cookie('oauth_state', state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 5 * 60 * 1000, // 5 minutes
      })
    } else {
      devStateStore.set(state, Date.now())
      setTimeout(() => devStateStore.delete(state), 5 * 60 * 1000)
    }

    const redirectUrl =
      GOOGLE_AUTH_URL +
      '?' +
      new URLSearchParams({
        client_id: config.GOOGLE_CLIENT_ID,
        redirect_uri: config.GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        prompt: 'consent select_account',
      }).toString()

    log.info('[GOOGLE OAUTH] Redirecting user', {
      env: config.NODE_ENV,
      usingCookie: isProduction,
      state,
    })

    res.redirect(redirectUrl)
  } catch (err) {
    const status = err.statusCode || 500
    res
      .status(status)
      .json({ success: false, message: err.message || 'Failed to initialize Google OAuth redirect' })
  }
}

// === Step 2: Handle Google callback ===
export const googleCallback = async (req, res) => {
  try {
    const { state, code } = req.query
    const stateCookie = req.cookies.oauth_state
    const isProduction = config.NODE_ENV === 'production'

    const valid = isProduction ? stateCookie && state === stateCookie : devStateStore.has(state)

    if (!valid)
      return res.status(400).json({ success: false, message: 'Invalid OAuth state' })

    if (isProduction) res.clearCookie('oauth_state')
    else devStateStore.delete(state)

    if (!code)
      return res.status(400).json({ success: false, message: 'Missing authorization code' })

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.GOOGLE_CLIENT_ID,
        client_secret: config.GOOGLE_CLIENT_SECRET,
        redirect_uri: config.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      log.error('[GOOGLE OAUTH] Token exchange failed', errText)
      return res.status(400).json({ success: false, message: 'Failed to exchange token with Google' })
    }

    const tokens = await tokenRes.json()
    if (!tokens.access_token)
      return res.status(400).json({ success: false, message: 'Access token not received from Google' })

    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!profileRes.ok) {
      const errText = await profileRes.text()
      log.error('[GOOGLE OAUTH] Profile fetch failed', errText)
      return res.status(400).json({ success: false, message: 'Failed to fetch Google profile' })
    }

    const profile = await profileRes.json()
    const { email, name, picture, sub, id } = profile
    const provider = 'google'
    const providerId = sub || id

    if (!email)
      return res.status(400).json({ success: false, message: 'Google profile missing email' })

    let user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      if (!user.emailVerifiedAt) {
        user = await prisma.user.update({
          where: { email },
          data: { emailVerifiedAt: new Date() },
        })
      }
    } else {
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email,
          name,
          username: email.split('@')[0],
          profileImage: picture,
          emailVerifiedAt: new Date(),
        },
      })
      log.info('[GOOGLE OAUTH] Created new user via Google', { email })
    }

    await prisma.oAuthAccount.upsert({
      where: { provider_providerId: { provider, providerId } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        provider,
        providerId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
      },
    })

    const { accessToken, refreshToken } = await issueTokens(user.id, user.email)

    const baseDomain = isProduction
      ? '.' + new URL(config.API_BASE_URL).hostname.replace(/^api\./, '')
      : undefined

    res.cookie('access_token', accessToken, {
      ...defaultCookieOptions,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: baseDomain,
      maxAge: 60 * 60 * 1000,
    })

    res.cookie('refresh_token', refreshToken, {
      ...defaultCookieOptions,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: baseDomain,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    log.info('[GOOGLE OAUTH] User logged in', { email: user.email })

    // Redirect back to frontend
    return res.redirect(config.CLIENT_WEB_REDIRECT)
  } catch (err) {
    log.error('GOOGLE OAUTH ERROR', err)
    const status = err.statusCode || 500
    res.status(status).json({
      success: false,
      message: err.message || 'Internal server error during Google OAuth',
    })
  }
}
