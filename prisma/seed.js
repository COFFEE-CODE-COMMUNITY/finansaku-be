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

  // --- Seed All 514 Cities ---
  // This list is from the Wikipedia article you provided.
  const allCityNames = [
    "Kabupaten Aceh Barat", "Kabupaten Aceh Barat Daya", "Kabupaten Aceh Besar", "Kabupaten Aceh Jaya",
    "Kabupaten Aceh Selatan", "Kabupaten Aceh Singkil", "Kabupaten Aceh Tamiang", "Kabupaten Aceh Tengah",
    "Kabupaten Aceh Tenggara", "Kabupaten Aceh Timur", "Kabupaten Aceh Utara", "Kabupaten Bener Meriah",
    "Kabupaten Bireuen", "Kabupaten Gayo Lues", "Kabupaten Nagan Raya", "Kabupaten Pidie",
    "Kabupaten Pidie Jaya", "Kabupaten Simeulue", "Kota Banda Aceh", "Kota Langsa", "Kota Lhokseumawe",
    "Kota Sabang", "Kota Subulussalam", "Kabupaten Asahan", "Kabupaten Batu Bara", "Kabupaten Dairi",
    "Kabupaten Deli Serdang", "Kabupaten Humbang Hasundutan", "Kabupaten Karo", "Kabupaten Labuhanbatu",
    "Kabupaten Labuhanbatu Selatan", "Kabupaten Labuhanbatu Utara", "Kabupaten Langkat",
    "Kabupaten Mandailing Natal", "Kabupaten Nias", "Kabupaten Nias Barat", "Kabupaten Nias Selatan",
    "Kabupaten Nias Utara", "Kabupaten Padang Lawas", "Kabupaten Padang Lawas Utara",
    "Kabupaten Pakpak Bharat", "Kabupaten Samosir", "Kabupaten Serdang Bedagai",
    "Kabupaten Simalungun", "Kabupaten Tapanuli Selatan", "Kabupaten Tapanuli Tengah",
    "Kabupaten Tapanuli Utara", "Kabupaten Toba", "Kota Binjai", "Kota Gunungsitoli", "Kota Medan",
    "Kota Padangsidimpuan", "Kota Pematangsiantar", "Kota Sibolga", "Kota Tanjungbalai",
    "Kota Tebing Tinggi", "Kabupaten Agam", "Kabupaten Dharmasraya", "Kabupaten Kepulauan Mentawai",
    "Kabupaten Lima Puluh Kota", "Kabupaten Padang Pariaman", "Kabupaten Pasaman",
    "Kabupaten Pasaman Barat", "Kabupaten Pesisir Selatan", "Kabupaten Sijunjung",
    "Kabupaten Solok", "Kabupaten Solok Selatan", "Kabupaten Tanah Datar", "Kota Bukittinggi",
    "Kota Padang", "Kota Padang Panjang", "Kota Pariaman", "Kota Payakumbuh", "Kota Sawahlunto",
    "Kota Solok", "Kabupaten Bengkalis", "Kabupaten Indragiri Hilir", "Kabupaten Indragiri Hulu",
    "Kabupaten Kampar", "Kabupaten Kepulauan Meranti", "Kabupaten Kuantan Singingi",
    "Kabupaten Pelalawan", "Kabupaten Rokan Hilir", "Kabupaten Rokan Hulu", "Kabupaten Siak",
    "Kota Dumai", "Kota Pekanbaru", "Kabupaten Batanghari", "Kabupaten Bungo", "Kabupaten Kerinci",
    "Kabupaten Merangin", "Kabupaten Muaro Jambi", "Kabupaten Sarolangun",
    "Kabupaten Tanjung Jabung Barat", "Kabupaten Tanjung Jabung Timur", "Kabupaten Tebo",
    "Kota Jambi", "Kota Sungai Penuh", "Kabupaten Banyuasin", "Kabupaten Empat Lawang",
    "Kabupaten Lahat", "Kabupaten Muara Enim", "Kabupaten Musi Banyuasin", "Kabupaten Musi Rawas",
    "Kabupaten Musi Rawas Utara", "Kabupaten Ogan Ilir", "Kabupaten Ogan Komering Ilir",
    "Kabupaten Ogan Komering Ulu", "Kabupaten Ogan Komering Ulu Selatan",
    "Kabupaten Ogan Komering Ulu Timur", "Kabupaten Penukal Abab Lematang Ilir",
    "Kota Lubuk Linggau", "Kota Pagaralam", "Kota Palembang", "Kota Prabumulih",
    "Kabupaten Bengkulu Selatan", "Kabupaten Bengkulu Tengah", "Kabupaten Bengkulu Utara",
    "Kabupaten Kaur", "Kabupaten Kepahiang", "Kabupaten Lebong", "Kabupaten Mukomuko",
    "Kabupaten Rejang Lebong", "Kabupaten Seluma", "Kota Bengkulu", "Kabupaten Lampung Barat",
    "Kabupaten Lampung Selatan", "Kabupaten Lampung Tengah", "Kabupaten Lampung Timur",
    "Kabupaten Lampung Utara", "Kabupaten Mesuji", "Kabupaten Pesawaran",
    "Kabupaten Pesisir Barat", "Kabupaten Pringsewu", "Kabupaten Tanggamus",
    "Kabupaten Tulang Bawang", "Kabupaten Tulang Bawang Barat", "Kabupaten Way Kanan",
    "Kota Bandar Lampung", "Kota Metro", "Kabupaten Bangka", "Kabupaten Bangka Barat",
    "Kabupaten Bangka Selatan", "Kabupaten Bangka Tengah", "Kabupaten Belitung",
    "Kabupaten Belitung Timur", "Kota Pangkalpinang", "Kabupaten Bintan", "Kabupaten Karimun",
    "Kabupaten Kepulauan Anambas", "Kabupaten Lingga", "Kabupaten Natuna", "Kota Batam",
    "Kota Tanjungpinang", "Kabupaten Administrasi Kepulauan Seribu",
    "Kota Administrasi Jakarta Barat", "Kota Administrasi Jakarta Pusat",
    "Kota Administrasi Jakarta Selatan", "Kota Administrasi Jakarta Timur",
    "Kota Administrasi Jakarta Utara", "Kabupaten Bandung", "Kabupaten Bandung Barat",
    "Kabupaten Bekasi", "Kabupaten Bogor", "Kabupaten Ciamis", "Kabupaten Cianjur",
    "Kabupaten Cirebon", "Kabupaten Garut", "Kabupaten Indramayu", "Kabupaten Karawang",
    "Kabupaten Kuningan", "Kabupaten Majalengka", "Kabupaten Pangandaran",
    "Kabupaten Purwakarta", "Kabupaten Subang", "Kabupaten Sukabumi", "Kabupaten Sumedang",
    "Kabupaten Tasikmalaya", "Kota Bandung", "Kota Banjar", "Kota Bekasi", "Kota Bogor",
    "Kota Cimahi", "Kota Cirebon", "Kota Depok", "Kota Sukabumi", "Kota Tasikmalaya",
    "Kabupaten Banjarnegara", "Kabupaten Banyumas", "Kabupaten Batang", "Kabupaten Blora",
    "Kabupaten Boyolali", "Kabupaten Brebes", "Kabupaten Cilacap", "Kabupaten Demak",
    "Kabupaten Grobogan", "Kabupaten Jepara", "Kabupaten Karanganyar", "Kabupaten Kebumen",
    "Kabupaten Kendal", "Kabupaten Klaten", "Kabupaten Kudus", "Kabupaten Magelang",
    "Kabupaten Pati", "Kabupaten Pekalongan", "Kabupaten Pemalang", "Kabupaten Purbalingga",
    "Kabupaten Purworejo", "Kabupaten Rembang", "Kabupaten Semarang", "Kabupaten Sragen",
    "Kabupaten Sukoharjo", "Kabupaten Tegal", "Kabupaten Temanggung", "Kabupaten Wonogiri",
    "Kabupaten Wonosobo", "Kota Magelang", "Kota Pekalongan", "Kota Salatiga", "Kota Semarang",
    "Kota Surakarta", "Kota Tegal", "Kabupaten Bantul", "Kabupaten Gunungkidul",
    "Kabupaten Kulon Progo", "Kabupaten Sleman", "Kota Yogyakarta", "Kabupaten Bangkalan",
    "Kabupaten Banyuwangi", "Kabupaten Blitar", "Kabupaten Bojonegoro", "Kabupaten Bondowoso",
    "Kabupaten Gresik", "Kabupaten Jember", "Kabupaten Jombang", "Kabupaten Kediri",
    "Kabupaten Lamongan", "Kabupaten Lumajang", "Kabupaten Madiun", "Kabupaten Magetan",
    "Kabupaten Malang", "Kabupaten Mojokerto", "Kabupaten Nganjuk", "Kabupaten Ngawi",
    "Kabupaten Pacitan", "Kabupaten Pamekasan", "Kabupaten Pasuruan", "Kabupaten Ponorogo",
    "Kabupaten Probolinggo", "Kabupaten Sampang", "Kabupaten Sidoarjo", "Kabupaten Situbondo",
    "Kabupaten Sumenep", "Kabupaten Trenggalek", "Kabupaten Tuban", "Kabupaten Tulungagung",
    "Kota Batu", "Kota Blitar", "Kota Kediri", "Kota Madiun", "Kota Malang", "Kota Mojokerto",
    "Kota Pasuruan", "Kota Probolinggo", "Kota Surabaya", "Kabupaten Lebak", "Kabupaten Pandeglang",
    "Kabupaten Serang", "Kabupaten Tangerang", "Kota Cilegon", "Kota Serang", "Kota Tangerang",
    "Kota Tangerang Selatan", "Kabupaten Badung", "Kabupaten Bangli", "Kabupaten Buleleng",
    "Kabupaten Gianyar", "Kabupaten Jembrana", "Kabupaten Karangasem", "Kabupaten Klungkung",
    "Kabupaten Tabanan", "Kota Denpasar", "Kabupaten Bima", "Kabupaten Dompu",
    "Kabupaten Lombok Barat", "Kabupaten Lombok Tengah", "Kabupaten Lombok Timur",
    "Kabupaten Lombok Utara", "Kabupaten Sumbawa", "Kabupaten Sumbawa Barat", "Kota Bima",
    "Kota Mataram", "Kabupaten Alor", "Kabupaten Belu", "Kabupaten Ende",
    "Kabupaten Flores Timur", "Kabupaten Kupang", "Kabupaten Lembata", "Kabupaten Malaka",
    "Kabupaten Manggarai", "Kabupaten Manggarai Barat", "Kabupaten Manggarai Timur",
    "Kabupaten Nagekeo", "Kabupaten Ngada", "Kabupaten Rote Ndao", "Kabupaten Sabu Raijua",
    "Kabupaten Sikka", "Kabupaten Sumba Barat", "Kabupaten Sumba Barat Daya",
    "Kabupaten Sumba Tengah", "Kabupaten Sumba Timur", "Kabupaten Timor Tengah Selatan",
    "Kabupaten Timor Tengah Utara", "Kota Kupang", "Kabupaten Bengkayang",
    "Kabupaten Kapuas Hulu", "Kabupaten Kayong Utara", "Kabupaten Ketapang",
    "Kabupaten Kubu Raya", "Kabupaten Landak", "Kabupaten Melawi", "Kabupaten Mempawah",
    "Kabupaten Sambas", "Kabupaten Sanggau", "Kabupaten Sekadau", "Kabupaten Sintang",
    "Kota Pontianak", "Kota Singkawang", "Kabupaten Barito Selatan", "Kabupaten Barito Timur",
    "Kabupaten Barito Utara", "Kabupaten Gunung Mas", "Kabupaten Kapuas", "Kabupaten Katingan",
    "Kabupaten Kotawaringin Barat", "Kabupaten Kotawaringin Timur", "Kabupaten Lamandau",
    "Kabupaten Murung Raya", "Kabupaten Pulang Pisau", "Kabupaten Seruyan",
    "Kabupaten Sukamara", "Kota Palangka Raya", "Kabupaten Balangan", "Kabupaten Banjar",
    "Kabupaten Barito Kuala", "Kabupaten Hulu Sungai Selatan", "Kabupaten Hulu Sungai Tengah",
    "Kabupaten Hulu Sungai Utara", "Kabupaten Kotabaru", "Kabupaten Tabalong",
    "Kabupaten Tanah Bumbu", "Kabupaten Tanah Laut", "Kabupaten Tapin", "Kota Banjarbaru",
    "Kota Banjarmasin", "Kabupaten Berau", "Kabupaten Kutai Barat", "Kabupaten Kutai Kartanegara",
    "Kabupaten Kutai Timur", "Kabupaten Mahakam Ulu", "Kabupaten Paser",
    "Kabupaten Penajam Paser Utara", "Kota Balikpapan", "Kota Bontang", "Kota Samarinda",
    "Kabupaten Bulungan", "Kabupaten Malinau", "Kabupaten Nunukan", "Kabupaten Tana Tidung",
    "Kota Tarakan", "Kabupaten Bolaang Mongondow", "Kabupaten Bolaang Mongondow Selatan",
    "Kabupaten Bolaang Mongondow Timur", "Kabupaten Bolaang Mongondow Utara",
    "Kabupaten Kepulauan Sangihe", "Kabupaten Kepulauan Siau Tagulandang Biaro",
    "Kabupaten Kepulauan Talaud", "Kabupaten Minahasa", "Kabupaten Minahasa Selatan",
    "Kabupaten Minahasa Tenggara", "Kabupaten Minahasa Utara", "Kota Bitung", "Kota Kotamobagu",
    "Kota Manado", "Kota Tomohon", "Kabupaten Banggai", "Kabupaten Banggai Kepulauan",
    "Kabupaten Banggai Laut", "Kabupaten Buol", "Kabupaten Donggala", "Kabupaten Morowali",
    "Kabupaten Morowali Utara", "Kabupaten Parigi Moutong", "Kabupaten Poso", "Kabupaten Sigi",
    "Kabupaten Tojo Una-Una", "Kabupaten Tolitoli", "Kota Palu", "Kabupaten Bantaeng",
    "Kabupaten Barru", "Kabupaten Bone", "Kabupaten Bulukumba", "Kabupaten Enrekang",
    "Kabupaten Gowa", "Kabupaten Jeneponto", "Kabupaten Kepulauan Selayar", "Kabupaten Luwu",
    "Kabupaten Luwu Timur", "Kabupaten Luwu Utara", "Kabupaten Maros",
    "Kabupaten Pangkajene dan Kepulauan", "Kabupaten Pinrang", "Kabupaten Sidenreng Rappang",
    "Kabupaten Sinjai", "Kabupaten Soppeng", "Kabupaten Takalar", "Kabupaten Tana Toraja",
    "Kabupaten Toraja Utara", "Kabupaten Wajo", "Kota Makassar", "Kota Parepare", "Kota Palopo",
    "Kabupaten Bombana", "Kabupaten Buton", "Kabupaten Buton Selatan", "Kabupaten Buton Tengah",
    "Kabupaten Buton Utara", "Kabupaten Kolaka", "Kabupaten Kolaka Timur",
    "Kabupaten Kolaka Utara", "Kabupaten Konawe", "Kabupaten Konawe Kepulauan",
    "Kabupaten Konawe Selatan", "Kabupaten Konawe Utara", "Kabupaten Muna",
    "Kabupaten Muna Barat", "Kabupaten Wakatobi", "Kota Baubau", "Kota Kendari",
    "Kabupaten Boalemo", "Kabupaten Bone Bolango", "Kabupaten Gorontalo",
    "Kabupaten Gorontalo Utara", "Kabupaten Pohuwato", "Kota Gorontalo", "Kabupaten Majene",
    "Kabupaten Mamasa", "Kabupaten Mamuju", "Kabupaten Mamuju Tengah", "Kabupaten Pasangkayu",
    "Kabupaten Polewali Mandar", "Kabupaten Buru", "Kabupaten Buru Selatan",
    "Kabupaten Kepulauan Aru", "Kabupaten Kepulauan Tanimbar", "Kabupaten Maluku Barat Daya",
    "Kabupaten Maluku Tengah", "Kabupaten Maluku Tenggara", "Kabupaten Seram Bagian Barat",
    "Kabupaten Seram Bagian Timur", "Kota Ambon", "Kota Tual", "Kabupaten Halmahera Barat",
    "Kabupaten Halmahera Selatan", "Kabupaten Halmahera Tengah", "Kabupaten Halmahera Timur",
    "Kabupaten Halmahera Utara", "Kabupaten Kepulauan Sula", "Kabupaten Pulau Morotai",
    "Kabupaten Pulau Taliabu", "Kota Ternate", "Kota Tidore Kepulauan", "Kabupaten Biak Numfor",
    "Kabupaten Jayapura", "Kabupaten Keerom", "Kabupaten Kepulauan Yapen",
    "Kabupaten Mamberamo Raya", "Kabupaten Sarmi", "Kabupaten Supiori", "Kabupaten Waropen",
    "Kota Jayapura", "Kabupaten Fakfak", "Kabupaten Kaimana", "Kabupaten Manokwari",
    "Kabupaten Manokwari Selatan", "Kabupaten Pegunungan Arfak", "Kabupaten Teluk Bintuni",
    "Kabupaten Teluk Wondama", "Kabupaten Asmat", "Kabupaten Boven Digoel", "Kabupaten Mappi",
    "Kabupaten Merauke", "Kabupaten Deiyai", "Kabupaten Dogiyai", "Kabupaten Intan Jaya",
    "Kabupaten Mimika", "Kabupaten Nabire", "Kabupaten Paniai", "Kabupaten Puncak",
    "Kabupaten Puncak Jaya", "Kabupaten Jayawijaya", "Kabupaten Lanny Jaya",
    "Kabupaten Mamberamo Tengah", "Kabupaten Nduga", "Kabupaten Pegunungan Bintang",
    "Kabupaten Tolikara", "Kabupaten Yalimo", "Kabupaten Yahukimo", "Kabupaten Maybrat",
    "Kabupaten Raja Ampat", "Kabupaten Sorong", "Kabupaten Sorong Selatan",
    "Kabupaten Tambrauw", "Kota Sorong",
    // These 4 are from your 2025 file, just in case
    "Jakarta", "Bandung", "Surabaya", "Yogyakarta"
  ];

  await seedCities(allCityNames)

  // --- Find a city for the demo user ---
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