import dotenv from 'dotenv'

// === Determine which .env file to load ===
const envPath =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env'

dotenv.config({ path: envPath, override: true })
console.log(`[env] Loaded environment from ${envPath} (override=true)`)

// === Define central config object ===
const config = {
  // === Environment ===
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8081,

  // === Base URLs ===
  API_BASE_URL: process.env.API_BASE_URL,
  APP_URL: process.env.APP_URL,
  CLIENT_WEB_REDIRECT: process.env.CLIENT_WEB_REDIRECT,

  // === Database ===
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,

  // === JWT / Tokens ===
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES,

  // === Redis ===
  ENABLE_REDIS: process.env.ENABLE_REDIS,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  // === Google OAuth2 ===
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  OAUTH2_ENDPOINT_GOOGLE:
    process.env.OAUTH2_ENDPOINT_GOOGLE ||
    'https://accounts.google.com/o/oauth2/v2/auth',
  GOOGLE_TOKEN_URL:
    process.env.GOOGLE_TOKEN_URL ||
    'https://oauth2.googleapis.com/token',
  GOOGLE_USERINFO_URL:
    process.env.GOOGLE_USERINFO_URL ||
    'https://www.googleapis.com/oauth2/v3/userinfo',

  // === Email ===
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: process.env.MAIL_PORT,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
  MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL,

  // === Logging ===
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_DIR: process.env.LOG_DIR || 'logs',
}

export default config
