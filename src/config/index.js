import dotenv from 'dotenv'
dotenv.config()

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8081,

  // === Base URLs ===
  apiBaseUrl: process.env.API_BASE_URL,
  appUrl: process.env.APP_URL,
  clientRedirectUrl: process.env.CLIENT_WEB_REDIRECT,

  // === Database ===
  databaseUrl: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL,

  // === JWT / Tokens ===
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES,
  refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES,

  // === Redis ===
  redisUrl: process.env.REDIS_URL,
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
  redisPassword: process.env.REDIS_PASSWORD,

  // === Google OAuth2 ===
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
  googleAuthUrl:
    process.env.OAUTH2_ENDPOINT_GOOGLE ||
    'https://accounts.google.com/o/oauth2/v2/auth',
  googleTokenUrl:
    process.env.GOOGLE_TOKEN_URL ||
    'https://oauth2.googleapis.com/token',
  googleUserInfoUrl:
    process.env.GOOGLE_USERINFO_URL ||
    'https://www.googleapis.com/oauth2/v3/userinfo',

  // === Email ===
  mailHost: process.env.MAIL_HOST,
  mailPort: process.env.MAIL_PORT,
  mailUser: process.env.MAIL_USER,
  mailPass: process.env.MAIL_PASS,
  mailFromName: process.env.MAIL_FROM_NAME,
  mailFromEmail: process.env.MAIL_FROM_EMAIL,

  // === Logging ===
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || 'logs',
}

export default config
