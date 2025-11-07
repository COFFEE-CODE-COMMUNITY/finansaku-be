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
import { parse } from 'csv-parse/sync'
import fs from 'node:fs'

// === Environment Variables ===
const BPS_API_KEY = config.BPS_API_KEY || ''
const CURRENT_YEAR = new Date().getFullYear()

// === Data Sources ===
// UMK (manual-only): admin uploads Kemnaker/BPS JSON into __mocks__/umk_YYYY.json
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
        cityId: String(cityId || cityName).trim(),
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
      const year = Number(item.year || item.tahun || CURRENT_YEAR)
      const index = Number(item.index || item.value || item.ihk)
      const currency = item.currency || 'IDR'
      const sourceUrl = item.sourceUrl || item.url || null
      if (!cityId || !index || !Number.isFinite(index)) return null
      return {
        cityId,
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
      const key = `${entry.cityId}-${entry.year}`
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

// === Fetch data from remote + cache + __mocks__ fallback ===
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

      // === Fallback to local mock JSON ===
      try {
        const mock = await import(`../__mocks__/${src.name}.json`, { assert: { type: 'json' } })
        const normalized =
          src.type === 'living_cost'
            ? normalizeLivingCostData(src.name, mock.default)
            : normalizeUMKData(src.name, mock.default)
        results.push({ source: `${src.name} (mock)`, type: src.type, data: normalized })
      } catch {
        // === Fallback to local CSV if exists ===
        try {
          const csvPath = new URL(`../__mocks__/${src.name}.csv`, import.meta.url)
          const csvRaw = fs.readFileSync(csvPath, 'utf-8')
          const parsed = parse(csvRaw, { columns: true, skip_empty_lines: true })
          const normalized =
            src.type === 'living_cost'
              ? normalizeLivingCostData(src.name, parsed)
              : normalizeUMKData(src.name, parsed)
          results.push({ source: `${src.name} (csv)`, type: src.type, data: normalized })
        } catch {
          logger.warn(`[Aggregator] No mock or CSV fallback for ${src.name}`)
        }
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
          create: {
            cityId: item.cityId,
            year: item.year,
            amount: item.amount,
          },
        })
      } else if (type === 'living_cost') {
        await prisma.livingCost.upsert({
          where: { cityId_year: { cityId: item.cityId, year: item.year } },
          update: {
            index: item.index,
            currency: item.currency ?? 'IDR',
            sourceUrl: item.sourceUrl || null,
          },
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
          message: `Stored ${type} for ${item.cityId} (${item.year})`,
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
    try {
      const mock = await import(`../__mocks__/umk_${CURRENT_YEAR}.json`, { assert: { type: 'json' } })
      rawResults = [{ source: 'kemnaker_manual', type: 'umk', data: mock.default }]
    } catch {
      logger.warn(`[Aggregator] No UMK dataset found for year ${CURRENT_YEAR}`)
      return
    }
  } else {
    try {
      rawResults = await fetchAllSources()
    } catch {
      logger.warn(`[Aggregator] Fetch failed, attempting cached fallback`)
      const cached = await getCache(cacheKey)
      if (cached) return cached
      return
    }
  }

  const { umk, living_cost } = reconcileData(rawResults)
  const result = type === 'umk' ? umk : living_cost

  if (result.length) await storeToDatabase(result, type)

  // === Cache write & invalidate old ===
  if (isRedisEnabled && redis?.isReady) {
    try {
      await delCache(`aggregator:${type}:${CURRENT_YEAR}:src:*`)
      await delCache(`aggregator:${type}:${CURRENT_YEAR}:combined`)
      await setCache(cacheKey, result, 86400 * 30)
      await redis.incr(keyVersion(type))
      await bumpVersion(type)
      await redis.hSet('aggregator:last_sync', {
        [type]: new Date().toISOString(),
        [`${type}_version`]: await redis.get(keyVersion(type)),
      })
      logger.info(`[Aggregator] Cache updated & version bumped for ${type}`)
    } catch (e) {
      logger.warn(`[Aggregator] Could not update Redis cache: ${e.message}`)
    }
  }

  logger.info(`✅ [Aggregator] ${type} sync complete`)
  return result
}

// === Exportable for testing ===
export { reconcileData }
