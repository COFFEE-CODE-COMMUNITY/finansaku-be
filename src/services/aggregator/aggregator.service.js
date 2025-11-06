import { prisma } from '../../config/prisma.js'
import logger from '../../config/logger.js'
import { redis, isRedisEnabled } from '../../config/redis.js'
import config from '../../config/index.js'

// === Environment Variables ===
const BPS_API_KEY = config.BPS_API_KEY || ''
const CURRENT_YEAR = new Date().getFullYear()

// === Data Sources ===
// UMK (manual-only): admin uploads Kemnaker/BPS JSON into __mocks__/umk_YYYY.json
// Living-cost: automatic BPS + fallback Kaggle (CSV/JSON)
const DEFAULT_SOURCES = [
  // BPS CPI / IHK — official monthly consumer price index
  {
    name: 'bps_ihk',
    type: 'living_cost',
    url: BPS_API_KEY
      ? `https://webapi.bps.go.id/v1/api/list?model=statictable&domain=ihk_90kota&lang=id&key=${BPS_API_KEY}`
      : null,
  },
  // Kaggle fallback (manual or mock)
  { name: 'kaggle_living_cost', type: 'living_cost', url: null },
]

const SOURCES = DEFAULT_SOURCES.filter((s) => s.url)

// === Helper: sleep for retry backoff ===
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// === Helper: safe fetch with retries ===
async function safeFetch(url, retries = 3, timeout = 10000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    try {
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(id)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return data
    } catch (err) {
      clearTimeout(id)
      logger.warn(`[Aggregator] Fetch attempt ${attempt} failed: ${err.message}`)
      if (attempt < retries) await sleep(1000 * attempt + Math.random() * 300)
      else throw err
    }
  }
}

// === Normalizers ===
function normalizeUMKData(source, raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const cityId = item.cityId || item.city_name || item.kota || item.id
      const cityName = item.cityName || item.nama_kota || item.kabupaten_kota
      const year = Number(item.year || item.tahun || CURRENT_YEAR)
      const amount = Number(item.amount || item.nilai_umk || item.umk)
      if (!cityId && !cityName) return null
      if (!amount || !Number.isFinite(amount)) return null
      return { cityId: String(cityId || cityName).trim(), year, amount, source }
    })
    .filter(Boolean)
}

function normalizeLivingCostData(source, raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const cityId = item.cityId || item.city_name || item.kota || item.id
      const year = Number(item.year || item.tahun || CURRENT_YEAR)
      const index = Number(item.index || item.value || item.ihk)
      const currency = item.currency || 'IDR'
      const sourceUrl = item.sourceUrl || item.url || null
      if (!cityId || !index || !Number.isFinite(index)) return null
      return { cityId, year, index, currency, sourceUrl, source }
    })
    .filter(Boolean)
}

// === Weighted trust logic (simplified average) ===
function reconcileData(rawResults = []) {
  const buckets = { umk: new Map(), living_cost: new Map() }

  for (const { source, type, data } of rawResults) {
    const normalized =
      type === 'living_cost'
        ? normalizeLivingCostData(source, data)
        : normalizeUMKData(source, data)

    const target = type === 'living_cost' ? buckets.living_cost : buckets.umk

    for (const entry of normalized) {
      const key = `${entry.cityId}-${entry.year}`
      if (!target.has(key)) {
        target.set(key, { ...entry, votes: [{ source, value: entry.amount ?? entry.index }] })
      } else {
        target.get(key).votes.push({ source, value: entry.amount ?? entry.index })
      }
    }
  }

  const finalize = (map, kind) => {
    const out = []
    for (const [, rec] of map) {
      const values = rec.votes.map((v) => Number(v.value)).filter((v) => Number.isFinite(v))
      if (!values.length) continue
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const confidence = 100 - Math.min(50, Math.abs(Math.max(...values) - Math.min(...values)) / avg * 100)
      if (kind === 'umk') out.push({ ...rec, amount: Math.round(avg), confidence })
      else out.push({ ...rec, index: Math.round(avg * 100) / 100, confidence })
    }
    return out
  }

  return {
    umk: finalize(buckets.umk, 'umk'),
    living_cost: finalize(buckets.living_cost, 'living_cost'),
  }
}

// === Fetch data from remote + __mocks__ ===
export async function fetchAllSources() {
  const results = []
  for (const src of SOURCES) {
    try {
      logger.info(`[Aggregator] Fetching ${src.type} from ${src.name}`)
      const data = await safeFetch(src.url)
      results.push({ source: src.name, type: src.type, data })
    } catch (err) {
      logger.warn(`[Aggregator] Failed ${src.name}: ${err.message}`)
      try {
        const mock = await import(`../__mocks__/${src.name}.json`, { assert: { type: 'json' } })
        results.push({ source: `${src.name} (mock)`, type: src.type, data: mock.default })
      } catch {
        logger.warn(`[Aggregator] No mock fallback for ${src.name}`)
      }
    }
  }
  return results
}

// === Store normalized data ===
export async function storeToDatabase(entries = [], type = 'umk') {
  for (const item of entries) {
    try {
      if (type === 'umk') {
        await prisma.uMK.upsert({
          where: { cityId_year: { cityId: item.cityId, year: item.year } },
          update: { amount: item.amount },
          create: { cityId: item.cityId, year: item.year, amount: item.amount },
        })
      } else if (type === 'living_cost') {
        await prisma.livingCost.upsert({
          where: { cityId_year: { cityId: item.cityId, year: item.year } },
          update: { index: item.index, currency: item.currency ?? 'IDR', sourceUrl: item.sourceUrl || null },
          create: {
            cityId: item.cityId,
            year: item.year,
            index: item.index,
            currency: item.currency ?? 'IDR',
            sourceUrl: item.sourceUrl || null,
          },
        })
      }

      await prisma.aggregatorLog.create({
        data: {
          cityId: item.cityId,
          year: item.year,
          type,
          chosenSource: item.source,
          confidence: item.confidence ?? 100,
          status: 'success',
        },
      })
    } catch (err) {
      logger.error(`[Aggregator] Failed storing ${type}: ${err.message}`)
    }
  }
}

// === Main autoSync (for cron or manual trigger) ===
export async function autoSync(type = 'living_cost') {
  logger.info(`🔁 [Aggregator] Starting autoSync for ${type}...`)

  let rawResults = []
  if (type === 'umk') {
    try {
      const mock = await import(`../__mocks__/umk_${CURRENT_YEAR}.json`, { assert: { type: 'json' } })
      rawResults = [{ source: 'kemnaker_manual', type: 'umk', data: mock.default }]
    } catch {
      logger.warn(`[Aggregator] No UMK dataset found for year ${CURRENT_YEAR}`)
      return
    }
  } else {
    rawResults = await fetchAllSources()
  }

  const { umk, living_cost } = reconcileData(rawResults)
  if (type === 'umk' && umk.length) await storeToDatabase(umk, 'umk')
  if (type === 'living_cost' && living_cost.length) await storeToDatabase(living_cost, 'living_cost')

  if (isRedisEnabled) {
    try {
      await redis.set('aggregator:last_sync', new Date().toISOString())
      logger.info('[Aggregator] Cached last_sync timestamp')
    } catch (e) {
      logger.warn(`[Aggregator] Could not set Redis cache: ${e.message}`)
    }
  }

  logger.info(`✅ [Aggregator] ${type} sync complete`)
}
