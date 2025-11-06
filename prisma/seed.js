import dotenv from 'dotenv'
import crypto from 'node:crypto'
import { prisma } from '../src/config/prisma.js'
// import { execSync } from 'node:child_process'
// import fs from 'node:fs'
// import path from 'node:path'
// import config from '../src/config/index.js'

dotenv.config()

// === Main Seeder Script ===
async function main() {
  console.log('🌱 Starting FinanSaku seed...')

  // --- Base City ---
  let city = await prisma.city.findFirst({ where: { name: 'Bandung' } })
  if (!city) {
    city = await prisma.city.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Bandung',
      },
    })
  }

  // --- UMK Linked to City ---
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

  // --- Allocation Template ---
  const template = await prisma.allocationTemplate.upsert({
    where: { persona: 'mahasiswa' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      persona: 'mahasiswa',
      description: 'Default budget template for students.',
    },
  })

  // --- Demo User ---
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

  // // --- Apply DB Constraints (optional) ---
  // const constraintsPath = path.resolve('./docs/db_constraints.sql')
  // if (fs.existsSync(constraintsPath)) {
  //   try {
  //     console.log('📜 Applying database constraints from db_constraints.sql...')
  //     execSync(`psql "${config.DIRECT_URL}" -f "${constraintsPath}"`, {
  //       stdio: 'inherit',
  //     })
  //     console.log('✅ Constraints applied successfully!')
  //   } catch (err) { // eslint-disable-line no-unused-vars
  //     console.warn('⚠️ Skipped applying constraints (psql not available or failed).')
  //   }
  // } else {
  //   console.warn('⚠️ No db_constraints.sql found, skipping constraint import.')
  // }
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
