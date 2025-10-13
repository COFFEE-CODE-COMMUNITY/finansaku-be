import rateLimit from 'express-rate-limit'

// === Login Rate Limiter ===
// Prevent brute-force attacks by limiting failed attempts per IP
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: 'Too many login attempts. Please try again later.' },
})
