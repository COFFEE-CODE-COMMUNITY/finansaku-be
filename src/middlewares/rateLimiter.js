import rateLimit from 'express-rate-limit'

// === Global Rate Limiter ===
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: { error: 'Too many requests. Please slow down.' },
})

// === Login Rate Limiter ===
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per window
  message: { error: 'Too many login attempts. Please try again later.' },
})

// === Simple IP Blocklist Example (extend later) ===
export const blocklistedIPs = new Set(['0.0.0.0']) // placeholder
export function ipBlocker(req, res, next) {
  if (blocklistedIPs.has(req.ip)) {
    return res.status(403).json({ error: 'Access denied.' })
  }
  next()
}
