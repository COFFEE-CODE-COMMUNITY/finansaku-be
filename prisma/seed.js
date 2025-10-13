import dotenv from 'dotenv'
import pkg from '@prisma/client'
import crypto from 'node:crypto'

dotenv.config()
const { PrismaClient } = pkg
const prisma = new PrismaClient()

// === Main Seeder Script ===
async function main() {
  console.log('🌱 Starting FinanSaku seed...')

  // Create or find a base city
  let city = await prisma.city.findFirst({ where: { name: 'Bandung' } })
  if (!city) {
    city = await prisma.city.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Bandung',
      },
    })
  }

  // Create or update UMK linked to that city
  const umk = await prisma.uMK.upsert({
    where: {
      cityId_year: {
        cityId: city.id,
        year: 2025,
      },
    },
    update: {},
    create: {
      id: crypto.randomUUID(),
      cityId: city.id,
      year: 2025,
      amount: 4500000,
    },
  })

  // Create or update a demo allocation template
  const template = await prisma.allocationTemplate.upsert({
    where: { persona: 'mahasiswa' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      persona: 'mahasiswa',
      description: 'Default budget template for students.',
    },
  })

  // Create or update demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@finansaku.com' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Demo User',
      username: 'demo',
      email: 'demo@finansaku.com',
      password: 'hashedpassword',
      cityId: city.id,
      templateId: template.id,
    },
  })

  console.table({
    city: city.name,
    umk: umk.amount.toString(),
    user: user.email,
  })

  console.log('✅ Seed complete!')
}

// === Run Seeder ===
main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
