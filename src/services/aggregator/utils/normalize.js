import { prisma } from '../../config/prisma.js'
const cityCache = new Map()

const ALIASES = {
  'kab. bandung': 'bandung',
  'kabupaten bandung': 'bandung',
  'kota bandung': 'bandung',
  'kab. bogor': 'bogor',
  'kabupaten bogor': 'bogor',
  'kota bogor': 'bogor',
}

export async function cityIdByName(name) {
  const key = name.toLowerCase().trim()
  if (cityCache.has(key)) return cityCache.get(key)

  const canonical = ALIASES[key] || key
  const city = await prisma.city.findFirst({
    where: { name: { equals: canonical, mode: 'insensitive' } },
  })

  if (!city) return null
  cityCache.set(key, city.id)
  return city.id
}

export function normalizeUMKRow(row) {
  return {
    cityName: row.cityName,
    year: Number(row.year),
    amount: Number(row.amount),
    sourceUrl: row.sourceUrl || null,
  }
}

export function normalizeLivingCostRow(row) {
  return {
    cityName: row.cityName,
    year: Number(row.year),
    index: Number(row.index),
    currency: row.currency || 'IDR',
    sourceUrl: row.sourceUrl || null,
  }
}
