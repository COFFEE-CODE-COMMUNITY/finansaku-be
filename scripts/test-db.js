import dotenv from "dotenv"
import pkg from "@prisma/client"

const { PrismaClient } = pkg

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log("DIRECT_URL =", process.env.DIRECT_URL)
  console.log("DATABASE_URL =", process.env.DATABASE_URL)

  try {
    const userCount = await prisma.user.count()
    console.log("✅ Connected! Found", userCount, "users.")
  } catch (err) {
    console.error("❌ Error:", err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
