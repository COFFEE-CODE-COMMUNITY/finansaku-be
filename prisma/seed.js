import dotenv from 'dotenv'
import crypto from 'node:crypto'
import { prisma } from '../src/config/prisma.js'
import bcrypt from 'bcrypt'
import Papa from 'papaparse'
import fs from 'fs'
import path from 'path'

dotenv.config()
const NASIONAL_CITY_ID = '00000000-0000-0000-0000-000000000001'

// Helper function to create cities only if they don't exist
async function seedCities(cityNames) {
  console.log(`Verifying ${cityNames.length + 1} city names...`)

  // Add "Nasional" city
  const allNames = [
    { id: NASIONAL_CITY_ID, name: 'Nasional' },
    ...cityNames.map(name => ({ id: crypto.randomUUID(), name })),
  ]

  const existingCities = await prisma.city.findMany({
    where: { name: { in: allNames.map(c => c.name), mode: 'insensitive' } },
    select: { name: true },
  })
  const existingSet = new Set(existingCities.map(c => c.name.toLowerCase()))

  const newCities = []
  for (const city of allNames) {
    if (!existingSet.has(city.name.toLowerCase())) {
      newCities.push(city)
    }
  }

  if (newCities.length > 0) {
    await prisma.city.createMany({ data: newCities })
    console.log(`🌱 Seeded ${newCities.length} new cities.`)
  } else {
    console.log('✅ All cities already exist in the database.')
  }
}

// === NEW: Function to seed UMK from CSV ===
async function seedUMK() {
  console.log('🌱 Seeding UMK data from CSV...')
  const csvPath = path.join(process.cwd(), 'src/services/aggregator/data/umk_2025.csv')
  if (!fs.existsSync(csvPath)) {
    console.warn('⚠️  umk_2025.csv not found, skipping UMK seed.')
    return
  }

  const csvFile = fs.readFileSync(csvPath, 'utf8')
  const { data } = Papa.parse(csvFile, { header: true, skipEmptyLines: true })

  let seededCount = 0
  for (const row of data) {
    const city = await prisma.city.findFirst({
      where: { name: { equals: row.cityName, mode: 'insensitive' } }
    })
    if (city && row.amount && Number(row.amount) > 0) {
      await prisma.uMK.upsert({
        where: { cityId_year: { cityId: city.id, year: 2025 } },
        update: { amount: Number(row.amount) },
        create: {
          id: crypto.randomUUID(),
          cityId: city.id,
          year: 2025,
          amount: Number(row.amount)
        }
      })
      seededCount++
    }
  }
  console.log(`✅ Seeded ${seededCount} UMK records for 2025.`)
}

// === NEW: Function to seed LivingCost from CSV ===
async function seedLivingCost() {
  console.log('🌱 Seeding Living Cost data from CSV...')
  const csvPath = path.join(process.cwd(), 'src/services/aggregator/data/living_cost.csv')
  if (!fs.existsSync(csvPath)) {
    console.warn('⚠️  living_cost.csv not found, skipping Living Cost seed.')
    return
  }

  const csvFile = fs.readFileSync(csvPath, 'utf8')
  const { data } = Papa.parse(csvFile, { header: true, skipEmptyLines: true })

  const nationalData = data.find(row => row.country === 'Indonesia')
  if (!nationalData) {
    console.error('❌ Could not find "Indonesia" row in living_cost.csv. Skipping.')
    return
  }

  const toNumber = (value) => {
    if (!value) return 0
    const n = Number(String(value).replace(/,/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  // Calculate percentages
  const restaurants    = toNumber(nationalData.restaurants)
  const markets        = toNumber(nationalData.markets)
  const transportation = toNumber(nationalData.transportation)
  const utilities      = toNumber(nationalData.utilities)
  const rent           = toNumber(nationalData.rent)
  const clothing       = toNumber(nationalData.clothing)
  const sports         = toNumber(nationalData.sports)
  const buyApartment   = toNumber(nationalData.buyApartment)

  const total = restaurants + markets + transportation + utilities + rent + clothing + sports + buyApartment
  const pct = (amount) => (total > 0 ? (amount / total) * 100 : 0)

  const livingCostEntry = {
    restaurantsPct: pct(restaurants),
    marketsPct: pct(markets),
    transportationPct: pct(transportation),
    utilitiesPct: pct(utilities),
    rentPct: pct(rent),
    clothingPct: pct(clothing),
    sportsLeisurePct: pct(sports),
    buyApartmentPct: pct(buyApartment),
  }

  await prisma.livingCost.upsert({
    where: { year_cityId: { year: 2025, cityId: NASIONAL_CITY_ID } },
    update: livingCostEntry,
    create: {
      id: crypto.randomUUID(),
      cityId: NASIONAL_CITY_ID,
      year: 2025,
      ...livingCostEntry
    }
  })
  console.log('✅ Seeded National Living Cost for 2025.')
}


// === NEW: Function to seed 3-month test user ===
async function seedGuestUser() {
  console.log('🌱 Seeding test user "Guest User"...')

  const hashedPassword = await bcrypt.hash('password123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'guest@finansaku.com' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Guest User',
      username: 'guest',
      email: 'guest@finansaku.com',
      password: hashedPassword,
      emailVerifiedAt: new Date(),
    },
  })
  console.log('Created user "Guest User".')

  const city = await prisma.city.findFirst({ where: { name: 'Kota Bandung' } })
  const umk = await prisma.uMK.findFirst({
    where: { cityId: city.id, year: 2025 },
  })

  if (!city || !umk) {
    console.error('❌ Kota Bandung or its 2025 UMK data not found. Skipping Saku seed for Guest User.')
    return
  }

  const dependents = 1
  const year = 2025
  const budgetTemplate = {
    "Makan": 1599166,
    "Transportasi": 415454,
    "Sewa": 665739,
    "Utilitas": 168017,
    "Pakaian": 112644,
    "Gaya Hidup": 144286,
    "Tabungan": 58853,
    "Misc/Dan Lain-Lain": 1335840 // Surplus
  }
  const totalBudget = Object.values(budgetTemplate).reduce((a, b) => a + b, 0)
  const testSalary = totalBudget // 5,000,000

  const monthsToSeed = [9, 10, 11] // 9=Sep, 10=Oct, 11=Nov

  for (const month of monthsToSeed) {
    console.log(`Seeding Saku for ${user.name} for month ${month}/${year}...`)

    const saku = await prisma.saku.create({
      data: {
        userId: user.id,
        cityId: city.id,
        umkId: umk.id,
        year: year,
        month: month,
        salary: testSalary,
        notes: `Saku seeder bulan ${month}`
      }
    })

    await prisma.sakuDetail.create({
      data: {
        sakuId: saku.id,
        key: 'dependents',
        valueNumber: dependents
      }
    })

    for (const [name, amount] of Object.entries(budgetTemplate)) {
      const category = await prisma.budgetCategory.upsert({
        where: { userId_name: { userId: user.id, name: name } },
        update: {},
        create: {
          id: crypto.randomUUID(),
          userId: user.id,
          name: name,
        },
      })

      await prisma.sakuAllocation.create({
        data: {
          id: crypto.randomUUID(),
          sakuId: saku.id,
          categoryId: category.id,
          percentage: (amount / testSalary) * 100,
          amount: amount,
        },
      })
    }
  }
  console.log('✅ "Guest User" seeded with 3 months of data.')
}


// === Main Seeder Script ===
async function main() {
  console.log('🌱 Starting FinanSaku seed...')
  await prisma.$connect()

  // === Seed All 265 Cities/Regencies (from your original file) ===
  const allCityNames = [
    "Kabupaten Simeulue", "Kabupaten Aceh Singkil", "Kabupaten Aceh Selatan", "Kabupaten Aceh Tenggara",
    "Kabupaten Aceh Timur", "Kabupaten Aceh Tengah", "Kabupaten Aceh Barat", "Kabupaten Aceh Besar",
    "Kabupaten Pidie", "Kabupaten Bireuen", "Kabupaten Aceh Utara", "Kabupaten Aceh Barat Daya",
    "Kabupaten Gayo Lues", "Kabupaten Nagan Raya", "Kabupaten Aceh Jaya", "Kabupaten Bener Meriah",
    "Kabupaten Pidie Jaya", "Kota Sabang", "Kota Langsa", "Kota Lhokseumawe", "Kota Subulussalam",
    "Kabupaten Aceh Tamiang", "Kota Banda Aceh", "Kabupaten Karo", "Kabupaten Deli Serdang",
    "Kabupaten Batu Bara", "Kota Medan", "Kabupaten Indragiri Hilir", "Kabupaten Kepulauan Meranti",
    "Kabupaten Kuantan Singingi", "Kabupaten Indragiri Hulu", "Kabupaten Pelalawan", "Kabupaten Siak",
    "Kabupaten Kampar", "Kabupaten Rokan Hulu", "Kabupaten Bengkalis", "Kabupaten Rokan Hilir",
    "Kota Pekanbaru", "Kota Dumai", "Kota Jambi", "Kabupaten Ogan Komering Ulu",
    "Kabupaten Ogan Komering Ilir", "Kabupaten Lahat", "Kabupaten Ogan Komering Ulu Selatan",
    "Kabupaten Ogan Ilir", "Kabupaten Empat Lawang", "Kabupaten Penukal Abab Lematang Ilir",
    "Kota Prabumulih", "Kota Pagar Alam", "Kota Lubuklinggau", "Kabupaten Muara Enim",
    "Kabupaten Musi Rawas", "Kabupaten Musi Banyuasin", "Kabupaten Banyuasin",
    "Kabupaten Ogan Komering Ulu Timur", "Kabupaten Musi Rawas Utara", "Kota Palembang",
    "Kabupaten Bangka", "Kabupaten Belitung", "Kabupaten Bangka Barat", "Kabupaten Bangka Tengah",
    "Kabupaten Bangka Selatan", "Kabupaten Belitung Timur", "Kota Pangkal Pinang", "Kabupaten Lingga",
    "Kota Tanjung Pinang", "Kabupaten Karimun", "Kabupaten Bintan", "Kabupaten Natuna",
    "Kabupaten Kepulauan Anambas", "Kota Batam", "Kabupaten Administrasi Kepulauan Seribu",
    "Kota Administrasi Jakarta Selatan", "Kota Administrasi Jakarta Timur", "Kota Administrasi Jakarta Pusat",
    "Kota Administrasi Jakarta Barat", "Kota Administrasi Jakarta Utara", "Kabupaten Bogor",
    "Kabupaten Sukabumi", "Kabupaten Bandung", "Kabupaten Sumedang", "Kabupaten Subang",
    "Kabupaten Purwakarta", "Kabupaten Karawang", "Kabupaten Bekasi", "Kabupaten Bandung Barat",
    "Kota Bogor", "Kota Bandung", "Kota Bekasi", "Kota Depok", "Kota Cimahi", "Kabupaten Malang",
    "Kabupaten Pasuruan", "Kabupaten Sidoarjo", "Kabupaten Mojokerto", "Kabupaten Gresik",
    "Kota Malang", "Kota Surabaya", "Kabupaten Tangerang", "Kabupaten Serang", "Kota Tangerang",
    "Kota Cilegon", "Kota Serang", "Kota Tangerang Selatan", "Kabupaten Badung",
    "Kabupaten Kotawaringin Barat", "Kabupaten Kotawaringin Timur", "Kabupaten Barito Selatan",
    "Kabupaten Barito Utara", "Kabupaten Sukamara", "Kabupaten Lamandau", "Kabupaten Seruyan",
    "Kabupaten Katingan", "Kabupaten Gunung Mas", "Kabupaten Murung Raya", "Kota Palangka Raya",
    "Kabupaten Kota Baru", "Kabupaten Tabalong", "Kabupaten Tanah Bumbu", "Kota Banjarmasin",
    "Kabupaten Mahakam Ulu", "Kabupaten Paser", "Kabupaten Kutai Barat", "Kabupaten Kutai Kartanegara",
    "Kabupaten Kutai Timur", "Kabupaten Berau", "Kabupaten Penajam Paser Utara", "Kota Balikpapan",
    "Kota Samarinda", "Kota Bontang", "Kabupaten Malinau", "Kabupaten Bulungan",
    "Kabupaten Tana Tidung", "Kabupaten Nunukan", "Kota Tarakan", "Kabupaten Bolaang Mongondow",
    "Kabupaten Minahasa", "Kabupaten Kepulauan Sangihe", "Kabupaten Kepulauan Talaud",
    "Kabupaten Minahasa Selatan", "Kabupaten Minahasa Utara", "Kabupaten Bolaang Mongondow Utara",
    "Kabupaten Siau Tagulandang Biaro", "Kabupaten Minahasa Tenggara",
    "Kabupaten Bolaang Mongondow Selatan", "Kabupaten Bolaang Mongondow Timur", "Kota Bitung",
    "Kota Tomohon", "Kota Kotamobagu", "Kota Manado", "Kabupaten Morowali",
    "Kabupaten Morowali Utara", "Kabupaten Kepulauan Selayar", "Kabupaten Bulukumba",
    "Kabupaten Bantaeng", "Kabupaten Jeneponto", "Kabupaten Takalar", "Kabupaten Gowa",
    "Kabupaten Sinjai", "Kabupaten Maros", "Kabupaten Barru", "Kabupaten Bone", "Kabupaten Soppeng",
    "Kabupaten Wajo", "Kabupaten Sidenreng Rappang", "Kabupaten Pinrang", "Kabupaten Enrekang",
    "Kabupaten Luwu", "Kabupaten Tana Toraja", "Kabupaten Luwu Utara", "Kabupaten Toraja Utara",
    "Kota Parepare", "Kota Palopo", "Kabupaten Pangkajene dan Kepulauan", "Kabupaten Luwu Timur",
    "Kota Makassar", "Kabupaten Fakfak", "Kabupaten Kaimana", "Kabupaten Teluk Wondama",
    "Kabupaten Teluk Bintuni", "Kabupaten Manokwari", "Kabupaten Manokwari Selatan",
    "Kabupaten Pegunungan Arfak", "Kabupaten Jayapura", "Kabupaten Kepulauan Yapen",
    "Kabupaten Biak Numfor", "Kabupaten Sarmi", "Kabupaten Keerom", "Kabupaten Waropen",
    "Kabupaten Supiori", "Kabupaten Mamberamo Raya", "Kota Jayapura", "Kabupaten Nabire",
    "Kabupaten Paniai", "Kabupaten Puncak Jaya", "Kabupaten Puncak", "Kabupaten Dogiyai",
    "Kabupaten Intan Jaya", "Kabupaten Deiyai", "Kabupaten Mimika", "Kabupaten Jayawijaya",
    "Kabupaten Yahukimo", "Kabupaten Pegunungan Bintang", "Kabupaten Tolikara", "Kabupaten Nduga",
    "Kabupaten Lanny Jaya", "Kabupaten Mamberamo Tengah", "Kabupaten Yalimo", "Kabupaten Merauke",
    "Kabupaten Asmat", "Kabupaten Boven Digoel", "Kabupaten Mappi", "Kabupaten Sorong Selatan",
    "Kabupaten Sorong", "Kabupaten Raja Ampat", "Kabupaten Tambrauw", "Kabupaten Maybrat",
    "Kota Sorong", "Kabupaten Pandeglang", "Kabupaten Lebak", "Kabupaten Jembrana",
    "Kabupaten Tabanan", "Kabupaten Gianyar", "Kabupaten Klungkung", "Kabupaten Karangasem",
    "Kabupaten Buleleng", "Kota Denpasar", "Kota Mataram", "Kabupaten Lombok Barat",
    "Kabupaten Lombok Tengah", "Kabupaten Lombok Timur", "Kabupaten Poso", "Kabupaten Donggala",
    "Kabupaten Tolitoli", "Kabupaten Banggai", "Kabupaten Buol", "Kabupaten Banggai Kepulauan",
    "Kabupaten Tojo Una-Una", "Kabupaten Sigi", "Kabupaten Banggai Laut", "Kota Palu",
    "Kota Kendari", "Kabupaten Konawe", "Kabupaten Kolaka", "Kabupaten Konawe Selatan",
    "Kabupaten Kolaka Utara", "Kabupaten Muna", "Kabupaten Gorontalo", "Kabupaten Bone Bolango",
    "Kabupaten Pasangkayu", "Kabupaten Mamuju", "Kabupaten Mamuju Tengah", "Kota Ambon",
    "Kabupaten Maluku Tengah", "Kabupaten Seram Bagian Barat", "Kota Ternate",
    "Kabupaten Halmahera Barat", "Kabupaten Halmahera Tengah", "Kabupaten Halmahera Utara",
    "Kabupaten Halmahera Selatan", "Kabupaten Halmahera Timur", "Kabupaten Kepulauan Sula",
    "Kabupaten Pulau Taliabu", "Kota Tidore Kepulauan", "Kabupaten Pulau Morotai"
  ]

  // Seed all the base data
  await seedCities(allCityNames)
  await seedUMK()
  await seedLivingCost()


  // === Find a city for the demo user ===
  let demoCity = await prisma.city.findFirst({
    where: { name: { equals: 'Kota Bandung', mode: 'insensitive' } },
  })
  if (!demoCity) {
    demoCity = await prisma.city.findFirst() // Fallback to any city
    if (!demoCity) {
      console.error("Critical error: No cities found after seeding.")
      process.exit(1)
    }
  }

  // === Allocation Template ===
  const template = await prisma.allocationTemplate.upsert({
    where: { persona: 'mahasiswa' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      persona: 'mahasiswa',
      description: 'Default budget template for students.',
    },
  })

  // === Demo User (Password Fixed) ===
  const demoHashedPassword = await bcrypt.hash('demo123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@finansaku.com' },
    update: {
      password: demoHashedPassword // Ensure password is set
    },
    create: {
      id: crypto.randomUUID(),
      name: 'Demo User',
      username: 'demo',
      email: 'demo@finansaku.com',
      password: demoHashedPassword,
      emailVerifiedAt: new Date(),
      cityId: demoCity.id,
      templateId: template.id,
    },
  })

  console.table({
    user: user.email,
    template: template.persona,
    city: demoCity.name
  })

  // === Seed 3-Month Test User ===
  await seedGuestUser()

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
