import * as authService from '../services/auth.service.js'
import { verifyToken, signTokens } from '../utils/jwt.js'
import { defaultCookieOptions, cookieDurations } from '../config/cookieOptions.js'

// === POST /auth/register ===
// Registers a new user and returns token cookie
export const register = async (req, res) => {
  try {
    const { name, username, email, password, cityId, templateId } = req.body

    if (!cityId || !templateId) {
      return res.status(400).json({ error: 'cityId and templateId are required' })
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
      message: 'User registered successfully',
      data: result,
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

// === POST /auth/login ===
// Authenticates user and issues both access & refresh token cookies
export const login = async (req, res) => {
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
      message: 'Login successful',
      data: { user },
    })
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
}

// === GET /auth/me ===
// Returns authenticated user info
export const me = async (req, res) => {
  res.status(200).json({
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

  res.status(200).json({ message: 'Logged out successfully' })
}

// === POST /auth/refresh ===
// Refreshes the access token using the refresh token
export const refresh = async (req, res) => {
  const refreshToken = req.cookies.refresh_token
  if (!refreshToken) {
    return res.status(401).json({ error: 'Missing refresh token' })
  }

  try {
    const decoded = verifyToken(refreshToken)
    if (!decoded || typeof decoded !== 'object' || typeof decoded.userId !== 'string') {
      return res.status(401).json({ error: 'Invalid refresh token' })
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

    res.status(200).json({ message: 'Token refreshed successfully' })
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' })
  }
}
