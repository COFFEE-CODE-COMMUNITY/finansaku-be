import * as authService from '../services/auth.service.js'
import { verifyToken, signTokens } from '../utils/jwt.js'
import { defaultCookieOptions, cookieDurations } from '../config/cookieOptions.js'
import { createLogger } from '../utils/scopedLogger.js'

const log = createLogger('AUTH')

// === POST /auth/register ===
// Registers a new user and returns token cookie
export const register = async (req, res, next) => {
  try {
    const { name, username, email, password, cityId, templateId } = req.body

    if (!cityId || !templateId) {
      const error = new Error('cityId and templateId are required')
      error.statusCode = 400
      throw error
    }

    const result = await authService.registerUser({
      name,
      username,
      email,
      password,
      cityId,
      templateId,
    })

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

// === POST /auth/login ===
// Authenticates user and issues both access & refresh token cookies
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const { user, accessToken, refreshToken } = await authService.loginUser({ email, password })

    res.cookie('access_token', accessToken, {
      ...defaultCookieOptions,
      maxAge: cookieDurations.access,
    })

    res.cookie('refresh_token', refreshToken, {
      ...defaultCookieOptions,
      maxAge: cookieDurations.refresh,
    })

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user },
    })
  } catch (err) {
    err.statusCode = 401
    next(err)
  }
}

// === GET /auth/me ===
// Returns authenticated user info
export const me = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authenticated user fetched successfully',
    data: {
      id: req.user.id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
      cityId: req.user.cityId,
      templateId: req.user.templateId,
    },
  })
}

// === POST /auth/logout ===
// Clears both JWT cookies
export const logout = (_req, res) => {
  const options = {
    ...defaultCookieOptions,
    maxAge: 0,
  }

  res.clearCookie('access_token', options)
  res.clearCookie('refresh_token', options)

  res.status(200).json({ success: true, message: 'Logged out successfully' })
}

// === POST /auth/refresh ===
// Refreshes the access token using the refresh token
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token
    if (!refreshToken) {
      const error = new Error('Missing refresh token')
      error.statusCode = 401
      throw error
    }

    const decoded = verifyToken(refreshToken)
    if (!decoded || typeof decoded !== 'object' || typeof decoded.userId !== 'string') {
      const error = new Error('Invalid refresh token')
      error.statusCode = 401
      throw error
    }

    // Token rotation
    const newAccessToken = signTokens({ userId: decoded.userId })
    const newRefreshToken = signTokens({ userId: decoded.userId })

    res.cookie('access_token', newAccessToken, {
      ...defaultCookieOptions,
      maxAge: cookieDurations.access,
    })

    res.cookie('refresh_token', newRefreshToken, {
      ...defaultCookieOptions,
      maxAge: cookieDurations.refresh,
    })

    res.status(200).json({ success: true, message: 'Token refreshed successfully' })
  } catch (err) {
    log.error('REFRESH ERROR', err)
    err.statusCode = err.statusCode || 401
    next(err)
  }
}

// === POST /auth/revoke ===
// Revokes all refresh tokens for the current user
export const revoke = async (req, res, next) => {
  try {
    await authService.revokeTokens(req.user.id)

    res.clearCookie('access_token', { ...defaultCookieOptions, maxAge: 0 })
    res.clearCookie('refresh_token', { ...defaultCookieOptions, maxAge: 0 })

    res.status(200).json({
      success: true,
      message: 'All sessions revoked successfully',
    })
  } catch (err) {
    log.error('[AUTH REVOKE ERROR]', err)
    err.statusCode = 500
    next(err)
  }
}
