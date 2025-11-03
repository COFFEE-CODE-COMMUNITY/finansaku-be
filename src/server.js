import dotenv from 'dotenv'
import app from './app.js'

// === Load environment variables early ===
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
})
console.log('✅ Environment variables loaded')

// === Define release and environment ===
const release =
  process.env.npm_package_version ||
  'development-build'

const PORT = process.env.PORT || 8081
const ENV = process.env.NODE_ENV || 'development'

console.log(`🚀 FinanSaku backend starting (release: ${release}, env: ${ENV})`)

// === Start server ===
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})
