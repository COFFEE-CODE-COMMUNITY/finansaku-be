import dotenv from "dotenv"
import { prisma } from '../../lib/prisma.js'
import config from '../src/config/index.js'

dotenv.config()

async function main() {
  console.log("DIRECT_URL =", config.DIRECT_URL)
  console.log("DATABASE_URL =", config.DATABASE_URL)

  try {
    const userCount = await prisma.user.count()
    console.log("✅ Connected! Found", userCount, "users.")
  } catch (err) {
    console.error("❌ Error:", err)
  }
}

main()
