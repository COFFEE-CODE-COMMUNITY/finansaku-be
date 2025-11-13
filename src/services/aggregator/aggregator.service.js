import { prisma } from '../../config/prisma.js'
import logger from '../../config/logger.js'
import { redis, isRedisEnabled } from '../../config/redis.js'
import config from '../../config/index.js'
import {
  delCache,
  bumpVersion,
  getCache,
  setCache,
  keySource,
  keyCombined,
  keyVersion,
} from '../../utils/cache.js'
import fs from 'node:fs'
import { URL } from 'node:url'
import crypto from 'node:crypto'

// === Environment Variables ===
const BPS_API_KEY = config.BPS_API_KEY || ''
const CURRENT_YEAR = new Date().getFullYear()

// === Data Sources ===
// UMK (manual-only): admin uploads Kemnaker/BPS JSON into ./data/umk_YYYY.json
// Living-cost: automatic BPS + fallback Kaggle (CSV/JSON)
const DEFAULT_SOURCES = [
  {
    name: 'bps_ihk',
    type: 'living_cost',
    url: BPS_API_KEY
      ? `https://webapi.bps.go.id/v1/api/list?model=statictable&domain=ihk_90kota&lang=id&key=${BPS_API_KEY}`
      : null,
  },
  { name: 'kaggle_living_cost', type: 'living_cost', url: null },
]

const SOURCES = DEFAULT_SOURCES.filter((s) => Boolean(s.url))

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
      return await res.json()
    } catch (err) {
      clearTimeout(id)
      logger.warn(`[Aggregator] Fetch attempt ${attempt} failed: ${err.message}`)
      if (attempt < retries) {
        await sleep(1000 * attempt + Math.random() * 300)
      } else {
        throw err
      }
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
      return {
        // Use city name as the ID for reconciliation
        cityId: String(cityName || cityId).trim(),
        year,
        amount,
        source,
      }
    })
    .filter(Boolean)
}

function normalizeLivingCostData(source, raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const cityId = item.cityId || item.city_name || item.kota || item.id
      const cityName = item.cityName || item.nama_kota || item.kabupaten_kota
      const year = Number(item.year || item.tahun || CURRENT_YEAR)
      const index = Number(item.index || item.value || item.ihk)
      const currency = item.currency || 'IDR'
      const sourceUrl = item.sourceUrl || item.url || null
      if (!cityId && !cityName) return null
      if (!index || !Number.isFinite(index)) return null
      return {
         // Use city name as the ID for reconciliation
        cityId: String(cityName || cityId).trim(),
        year,
        index,
        currency,
        sourceUrl,
        source,
      }
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
      const key = `${entry.cityId.toLowerCase()}-${entry.year}`
      if (!target.has(key)) {
        target.set(key, {
          ...entry,
          votes: [{ source, value: entry.amount ?? entry.index }],
        })
      } else {
        target.get(key).votes.push({
          source,
          value: entry.amount ?? entry.index,
        })
      }
    }
  }

  const finalize = (map, kind) => {
    const out = []
    for (const [, rec] of map) {
      const values = rec.votes
        .map((v) => Number(v.value))
        .filter((v) => Number.isFinite(v))
      if (!values.length) continue

      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const diff = Math.abs(Math.max(...values) - Math.min(...values))
      const confidence = 100 - Math.min(50, (diff / avg) * 100)

      if (kind === 'umk') {
        out.push({
          ...rec,
          amount: Math.round(avg),
          confidence: Math.round(confidence),
        })
      } else {
        out.push({
          ...rec,
          index: Math.round(avg * 100) / 100,
          confidence: Math.round(confidence),
        })
      }
    }
    return out
  }

  return {
    umk: finalize(buckets.umk, 'umk'),
    living_cost: finalize(buckets.living_cost, 'living_cost'),
  }
}

// === Helper function to read local JSON data ===
function readLocalJson(fileName) {
  try {
    const filePath = new URL(`./data/${fileName}`, import.meta.url)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(fileContent)
  } catch (err) {
    logger.warn(`[Aggregator] Could not read local data file: ${fileName}. Error: ${err.message}`)
    return null
  }
}

// === Fetch data from remote + cache + data fallback ===
export async function fetchAllSources() {
  const results = []

  for (const src of SOURCES) {
    const srcKey = keySource(src.type, CURRENT_YEAR, src.name)
    try {
      logger.info(`[Aggregator] Fetching ${src.type} from ${src.name}`)
      const raw = await safeFetch(src.url)

      // normalize remote JSON (handles both array and { data: [...] } shapes)
      const normalized =
        src.type === 'living_cost'
          ? normalizeLivingCostData(src.name, Array.isArray(raw?.data) ? raw.data : raw)
          : normalizeUMKData(src.name, Array.isArray(raw?.data) ? raw.data : raw)

      if (isRedisEnabled && redis?.isReady) {
        await setCache(srcKey, normalized, 86400) // per-source TTL: 1 day
        await redis.incr(keyVersion(src.type)) // track version per type
      }

      results.push({ source: src.name, type: src.type, data: normalized })
    } catch (err) {
      logger.warn(`[Aggregator] Failed ${src.name}: ${err.message}`)

      // === Try per-source cached data ===
      if (isRedisEnabled && redis?.isReady) {
        const cached = await getCache(srcKey)
        if (cached) {
          logger.info(`[Aggregator] Using cached ${src.name} due to failure`)
          results.push({ source: `${src.name} (cache)`, type: src.type, data: cached })
          continue
        }
      } else {
        logger.warn('[Aggregator] Redis disabled, skipping cache fallback')
      }

      // === Fallback to local data JSON ===
      const mockData = readLocalJson(`${src.name}.json`)
      if (mockData) {
        const normalized =
          src.type === 'living_cost'
            ? normalizeLivingCostData(src.name, mockData)
            : normalizeUMKData(src.name, mockData)
        results.push({ source: `${src.name} (mock)`, type: src.type, data: normalized })
      } else {
        logger.warn(`[Aggregator] No mock JSON fallback found for ${src.name}`)
      }
    }
  }

  return results
}

// === Store normalized data ===
export async function storeToDatabase(entries = [], type = 'umk') {
  for (const item of entries) {
    try {
      let cityId = item.cityId
      if (!cityId.includes('-')) { // Simple check if it's a name, not UUID
        const city = await prisma.city.findFirst({
          where: { name: { equals: cityId, mode: 'insensitive' } }
        })
        
        if (city) {
          cityId = city.id // Replace name with UUID
        } else {
          logger.warn(`[Aggregator] Skipping entry: Could not find city ID for name "${item.cityId}"`)
          continue // Skip this record
        }
      }

      if (type === 'umk') {
        await prisma.uMK.upsert({
          where: { cityId_year: { cityId: cityId, year: item.year } },
          update: { amount: item.amount },
          create: {
            id: crypto.randomUUID(), // Add UUID
            cityId: cityId,
            year: item.year,
            amount: item.amount,
          },
        })
      } else if (type === 'living_cost') {
        await prisma.livingCost.upsert({
          where: { cityId_year: { cityId: cityId, year: item.year } },
          update: {
            index: item.index,
            currency: item.currency ?? 'IDR',
            sourceUrl: item.sourceUrl || null,
          },
          create: {
            id: crypto.randomUUID(), // Add UUID
            cityId: cityId,
            year: item.year,
            index: item.index,
            currency: item.currency ?? 'IDR',
            sourceUrl: item.sourceUrl || null,
          },
        })
      }

      await prisma.aggregatorLog.create({
        data: {
          id: crypto.randomUUID(), // Add UUID
          cityId: cityId,
          year: item.year,
          type,
          chosenSource: item.source,
          confidence: item.confidence ?? 100,
          status: 'success',
          message: `Stored ${type} for ${cityId} (${item.year})`,
        },
      })
    } catch (err) {
      logger.error(`[Aggregator] Failed storing ${type} (City: ${item.cityId}): ${err.message}`)
    }
  }
}

// === Main autoSync (for cron or manual trigger) ===
export async function autoSync(type = 'living_cost') {
  logger.info(`🔁 [Aggregator] Starting autoSync for ${type}...`)

  if (!isRedisEnabled) logger.info('[Aggregator] Redis disabled — stateless mode')

  // === Try cache first ===
  const cacheKey = keyCombined(type, CURRENT_YEAR)
  if (isRedisEnabled && redis?.isReady) {
    const cached = await getCache(cacheKey)
    if (cached) {
      logger.info(`[Aggregator] Using cached ${type} data for ${CURRENT_YEAR}`)
      return cached
    }
  }

  let rawResults = []
  if (type === 'umk') {
    const mockData = readLocalJson(`umk_${CURRENT_YEAR}.json`)
    if (mockData) {
      rawResults = [{ source: 'kemnaker_manual', type: 'umk', data: mockData }]
    } else {
      logger.warn(`[Aggregator] No UMK dataset found for year ${CURRENT_YEAR}`)
      return // Return undefined to controller
    }
  } else {
    try {
      rawResults = await fetchAllSources()
    } catch (err) {
      logger.warn(`[Aggregator] Fetch failed, attempting cached fallback: ${err.message}`)
      const cached = await getCache(cacheKey)
      if (cached) return cached
      return // Return undefined to controller
    }
  }

  const { umk, living_cost } = reconcileData(rawResults)
  const result = type === 'umk' ? umk : living_cost

  if (result.length) {
    await storeToDatabase(result, type)
  } else {
    logger.warn(`[Aggregator] No data reconciled for ${type}.`)
    return result // Return empty array to controller
  }

  // === Cache write & invalidate old ===
  if (isRedisEnabled && redis?.isReady) {
    try {
      await delCache(`aggregator:${type}:${CURRENT_YEAR}:src:*`)
      await delCache(cacheKey) // Use cacheKey variable
      await setCache(cacheKey, result, 86400 * 30) // Cache for 30 days
      await bumpVersion(type)
      
      const currentVersion = await redis.get(keyVersion(type))
      await redis.hSet('aggregator:last_sync', {
        [type]: new Date().toISOString(),
        [`${type}_version`]: currentVersion || '1',
      })
      logger.info(`[Aggregator] Cache updated & version bumped for ${type}`)
    } catch (e) {
      logger.warn(`[Aggregator] Could not update Redis cache: ${e.message}`)
    }
  }

  logger.info(`✅ [Aggregator] ${type} sync complete`)
  return result // Return the processed data
}

// === Exportable for testing ===
export { reconcileData }