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
  NODE_ENV: process.env.NODE_ENV?.trim() || 'development',
  PORT: process.env.PORT?.trim() || 8081,

  // === Base URLs ===
  API_BASE_URL: process.env.API_BASE_URL?.trim(),
  APP_URL: process.env.APP_URL?.trim(),
  CLIENT_WEB_REDIRECT: process.env.CLIENT_WEB_REDIRECT?.trim(),
  CLIENT_VERIFY_URL: process.env.CLIENT_VERIFY_URL?.trim(),
  CLIENT_RESET_URL: process.env.CLIENT_RESET_URL?.trim(),
  CLIENT_EMAIL_CHANGE_URL: process.env.CLIENT_EMAIL_CHANGE_URL?.trim(),
  CLIENT_URL: process.env.CLIENT_URL?.trim(),

  // === Database ===
  DATABASE_URL: process.env.DATABASE_URL?.trim(),
  DIRECT_URL: process.env.DIRECT_URL?.trim(),

  // === JWT / Tokens ===
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET?.trim(),
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET?.trim(),
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES?.trim(),
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES?.trim(),

  // === Redis ===
  ENABLE_REDIS: process.env.ENABLE_REDIS?.trim(),
  REDIS_URL: process.env.REDIS_URL?.trim(),
  REDIS_HOST: process.env.REDIS_HOST?.trim(),
  REDIS_PORT: process.env.REDIS_PORT?.trim(),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD?.trim(),

  // === Google OAuth2 ===
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.trim(),
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET?.trim(),
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI?.trim(),
  OAUTH2_ENDPOINT_GOOGLE:
    process.env.OAUTH2_ENDPOINT_GOOGLE?.trim() ||
    'https://accounts.google.com/o/oauth2/v2/auth',
  GOOGLE_TOKEN_URL:
    process.env.GOOGLE_TOKEN_URL?.trim() ||
    'https://oauth2.googleapis.com/token',
  GOOGLE_USERINFO_URL:
    process.env.GOOGLE_USERINFO_URL?.trim() ||
    'https://www.googleapis.com/oauth2/v3/userinfo',

  // === Email ===
  MAIL_HOST: process.env.MAIL_HOST?.trim(),
  MAIL_PORT: process.env.MAIL_PORT?.trim(),
  MAIL_USER: process.env.MAIL_USER?.trim(),
  MAIL_PASS: process.env.MAIL_PASS?.trim(),
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME?.trim(),
  MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL?.trim(),

  // === Logging ===
  LOG_LEVEL: process.env.LOG_LEVEL?.trim() || 'info',
  LOG_DIR: process.env.LOG_DIR?.trim() || 'logs',

  // === Rate Limiting ===
  RATE_LIMIT_GLOBAL: process.env.RATE_LIMIT_GLOBAL?.trim(),
  RATE_LIMIT_AUTH: process.env.RATE_LIMIT_AUTH?.trim(),
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS?.trim(),

  // === Aggregator Service ===
  AGGREGATOR_ENABLE_CRON: process.env.AGGREGATOR_ENABLE_CRON?.trim(),
  AGGREGATOR_CRON_EXPRESSION: process.env.AGGREGATOR_CRON_EXPRESSION?.trim(),
  BPS_API_KEY: process.env.BPS_API_KEY?.trim(),
  AGGREGATOR_SOURCES: process.env.AGGREGATOR_SOURCES?.trim(),
}

export default config