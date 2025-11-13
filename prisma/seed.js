import dotenv from 'dotenv'
import crypto from 'node:crypto'
import { prisma } from '../src/config/prisma.js'

dotenv.config()

// Helper function to create cities only if they don't exist
async function seedCities(cityNames) {
  console.log(`Verifying ${cityNames.length} city names...`)
  const existingCities = await prisma.city.findMany({
    where: { name: { in: cityNames, mode: 'insensitive' } },
    select: { name: true },
  })
  const existingSet = new Set(existingCities.map(c => c.name.toLowerCase()))

  const newCities = []
  for (const name of cityNames) {
    if (!existingSet.has(name.toLowerCase())) {
      newCities.push({
        id: crypto.randomUUID(),
        name: name,
      })
    }
  }

  if (newCities.length > 0) {
    await prisma.city.createMany({ data: newCities })
    console.log(`🌱 Seeded ${newCities.length} new cities.`)
  } else {
    console.log('✅ All cities already exist in the database.')
  }
}

// === Main Seeder Script ===
async function main() {
  console.log('🌱 Starting FinanSaku seed...')

  // === Seed All 265 Cities/Regencies ===
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

  await seedCities(allCityNames)

  // === Find a city for the demo user ===
  let demoCity = await prisma.city.findFirst({
    where: { name: { equals: 'Kota Bandung', mode: 'insensitive' } },
  })

  if (!demoCity) {
    demoCity = await prisma.city.findFirst({
      where: { name: { equals: 'Bandung', mode: 'insensitive' } },
    })
  }

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

  // === Demo User ===
  const user = await prisma.user.upsert({
    where: { email: 'demo@finansaku.com' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Demo User',
      username: 'demo',
      email: 'demo@finansaku.com',
      password: 'hashedpassword', // You should hash this in a real app
      cityId: demoCity.id, // Use the found city's ID
      templateId: template.id,
    },
  })

  console.table({
    user: user.email,
    template: template.persona,
    city: demoCity.name
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