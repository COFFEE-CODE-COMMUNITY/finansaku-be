// === Cookie Options ===
// Applied to all auth cookies (access + refresh)
export const defaultCookieOptions = {
  httpOnly: true,
  secure: true, //process.env.NODE_ENV === 'production', // must be true for HTTPS
  sameSite: 'none', //process.env.NODE_ENV === 'production' ? 'none' : 'lax', // cross-site enabled for prod      
  domain: 'finansaku.space', //process.env.NODE_ENV === 'production' ? 'finansaku.space' : undefined,
  path: '/',
}

// === Cookie Durations (milliseconds) ===
export const cookieDurations = {
  access: 60 * 60 * 1000, // 1 hour
  refresh: 7 * 24 * 60 * 60 * 1000, // 7 days
}
