// === Cookie Options ===
// Applied to all auth cookies (access + refresh)
export const defaultCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
}

// === Cookie Durations (milliseconds) ===
export const cookieDurations = {
  access: 60 * 60 * 1000, // 1 hour
  refresh: 7 * 24 * 60 * 60 * 1000, // 7 days
}
