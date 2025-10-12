// ============================================
// FinanSaku — Prisma CRUD Test Script
// --------------------------------------------
// Purpose:
// - Verify that Prisma can perform basic Create, Read, Update, and Delete
//   operations on your Supabase PostgreSQL database
// - Confirms that seeding worked and schema mappings are correct
// --------------------------------------------
// Notes:
// - Uses dotenv to load .env
// - Works with Prisma Client ESM (requires "type": "module" in package.json)
// - Safe for local testing; does not modify existing user data
// ============================================

import dotenv from "dotenv"
import pkg from "@prisma/client"
import crypto from "node:crypto"

dotenv.config()
const { PrismaClient } = pkg
const prisma = new PrismaClient()

async function main() {
  console.log("🧪 Running CRUD test...")

  // 1️⃣ READ existing city
  const existingCity = await prisma.city.findFirst()
  if (!existingCity) throw new Error("No city found. Did you seed first?")
  console.log("✅ Found city:", existingCity.name)

  // 2️⃣ CREATE new UMK for test (linked to first city)
  const testUMK = await prisma.uMK.create({
    data: {
      id: crypto.randomUUID(),
      cityId: existingCity.id,
      year: 2026,
      amount: 5000000,
    },
  })
  console.log("✅ Created UMK:", testUMK)

  // 3️⃣ READ UMK
  const foundUMK = await prisma.uMK.findFirst({
    where: { cityId: existingCity.id, year: 2026 },
  })
  console.log("🔍 Found UMK:", foundUMK.amount.toString())

  // 4️⃣ UPDATE UMK
  const updated = await prisma.uMK.update({
    where: { id: testUMK.id },
    data: { amount: 5500000 },
  })
  console.log("✏️ Updated UMK amount to:", updated.amount.toString())

  // 5️⃣ DELETE UMK
  await prisma.uMK.delete({ where: { id: testUMK.id } })
  console.log("🗑️ Deleted test UMK successfully")

  console.log("\n✅ CRUD test completed successfully.")
}

main()
  .catch((e) => {
    console.error("❌ CRUD test failed:", e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
