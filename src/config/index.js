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
  ENABLE_REDIS: process.env.ENABLE_REDIS === 'true',
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
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
  MAIL_PORT: Number(process.env.MAIL_PORT) || 587,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
  MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL,

  // === Logging ===
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_DIR: process.env.LOG_DIR || 'logs',

  // === Aggregator ===
  AGGREGATOR_ENABLE_CRON:
    process.env.AGGREGATOR_ENABLE_CRON === 'true',
  AGGREGATOR_CRON_EXPRESSION:
    process.env.AGGREGATOR_CRON_EXPRESSION || '0 3 1 * *',
  AGGREGATOR_HTTP_TIMEOUT_MS:
    Number(process.env.AGGREGATOR_HTTP_TIMEOUT_MS) || 8000,
  AGGREGATOR_MAX_RETRIES:
    Number(process.env.AGGREGATOR_MAX_RETRIES) || 3,
  AGGREGATOR_BACKOFF_BASE_MS:
    Number(process.env.AGGREGATOR_BACKOFF_BASE_MS) || 500,
  AGGREGATOR_CACHE_TTL_S:
    Number(process.env.AGGREGATOR_CACHE_TTL_S) || 86400,
  AGGREGATOR_CONFIRM_TTL_S:
    Number(process.env.AGGREGATOR_CONFIRM_TTL_S) || 604800,
  AGGREGATOR_SOURCE_WEIGHTS:
    process.env.AGGREGATOR_SOURCE_WEIGHTS
      ? JSON.parse(process.env.AGGREGATOR_SOURCE_WEIGHTS)
      : { kemnaker: 0.6, bps: 0.3, kaggle: 0.1 },
  AGGREGATOR_SOURCES: process.env.AGGREGATOR_SOURCES,
  BPS_API_KEY: process.env.BPS_API_KEY,
}

export default config
