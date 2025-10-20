// === Imports ===
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { authRateLimiter } from './middlewares/rateLimiter.js'
import authRoutes from './routes/auth.routes.js'

// === Environment Variables ===
dotenv.config()

// === Express App ===
const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// === CORS Configuration ===
// Enables frontend to send cookies with cross-origin requests
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)

// === Rate Limiter ===
// Only applied to login endpoint to prevent brute-force attacks
app.use('/api/v1/auth/login', authRateLimiter)

// === Root Health Check ===
app.get('/', (req, res) => {
  res.json({ message: 'FinanSaku API is running' })
})

// === Health Check Endpoint ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// === Routes ===
app.use('/api/v1/auth', authRoutes)

// === Server ===
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 8081
  app.listen(PORT, () => {
    console.log(`✅ FinanSaku backend running on port ${PORT}`)
  })
}

export default app
