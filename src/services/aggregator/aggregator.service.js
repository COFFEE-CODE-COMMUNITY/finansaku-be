import { prisma } from '../../config/prisma.js'
import logger from '../../config/logger.js'
import { redis, isRedisEnabled } from '../../config/redis.js'
import config from '../../config/index.js'
import { delCache, bumpVersion, getCache, setCache, keyCombined, keyVersion } from '../../utils/cache.js'
import fs from 'node:fs'
import { URL } from 'node:url'
import crypto from 'node:crypto'
import { kaggle } from './adapters/kaggle.adapter.js' // Import Kaggle adapter

// === Environment Variables ===
const CURRENT_YEAR = new Date().getFullYear()

// === Helper function to read local JSON data (for UMK) ===
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

// === Normalizers ===
function normalizeUMKData(source, raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => ({
    cityId: String(item.cityName).trim(), // Use city name as the key
    year: Number(item.year || CURRENT_YEAR),
    amount: Number(item.amount),
    source,
  })).filter(item => item.cityId && item.amount > 0)
}

function normalizeLivingCostData(source, raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => ({
    country: String(item.country).trim(), // Use country as the key
    year: Number(item.year || CURRENT_YEAR),
    index: Number(item.index),
    currency: item.currency || 'IDR',
    sourceUrl: item.sourceUrl || null,
    source,
  })).filter(item => item.country && item.index > 0)
}

// === Simplified reconciliation logic ===
function reconcileData(rawResults = []) {
  const buckets = { umk: new Map(), living_cost: new Map() }

  for (const { source, type, data } of rawResults) {
    const normalized = type === 'living_cost'
      ? normalizeLivingCostData(source, data)
      : normalizeUMKData(source, data)

    const target = type === 'living_cost' ? buckets.living_cost : buckets.umk

    for (const entry of normalized) {
      // Use country for living_cost key, cityId for umk key
      const key = type === 'living_cost'
        ? `${entry.country.toLowerCase()}-${entry.year}`
        : `${entry.cityId.toLowerCase()}-${entry.year}`
        
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
      const values = rec.votes.map((v) => Number(v.value)).filter((v) => Number.isFinite(v))
      if (!values.length) continue

      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const confidence = 100 // Manual data is trusted

      if (kind === 'umk') {
        out.push({ ...rec, amount: Math.round(avg), confidence })
      } else {
        out.push({ ...rec, index: Math.round(avg * 100) / 100, confidence })
      }
    }
    return out
  }

  return {
    umk: finalize(buckets.umk, 'umk'),
    living_cost: finalize(buckets.living_cost, 'living_cost'),
  }
}

// === Store normalized data ===
export async function storeToDatabase(entries = [], type = 'umk') {
  for (const item of entries) {
    let logCityId = null
    try {
      if (type === 'umk') {
        // --- UMK Storage (by City Name) ---
        let cityId = item.cityId
        // Resolve city name (e.g., "Kota Bandung") to city UUID
        const city = await prisma.city.findFirst({
          where: { name: { equals: cityId, mode: 'insensitive' } }
        })
        
        if (city) {
          cityId = city.id // Replace name with UUID
          logCityId = city.id
        } else {
          logger.warn(`[Aggregator] Skipping UMK entry: Could not find city ID for name "${item.cityId}"`)
          continue // Skip this record
        }

        await prisma.uMK.upsert({
          where: { cityId_year: { cityId: cityId, year: item.year } },
          update: { amount: item.amount },
          create: {
            id: crypto.randomUUID(), 
            cityId: cityId,
            year: item.year,
            amount: item.amount,
          },
        })
      } else if (type === 'living_cost') {
        // --- LivingCost Storage (by Country Name) ---
        await prisma.livingCost.upsert({
          where: { country_year: { country: item.country, year: item.year } },
          update: {
            index: item.index,
            currency: item.currency ?? 'IDR',
            sourceUrl: item.sourceUrl || null,
          },
          create: {
            id: crypto.randomUUID(), 
            country: item.country,
            year: item.year,
            index: item.index,
            currency: item.currency ?? 'IDR',
            sourceUrl: item.sourceUrl || null,
          },
        })
      }

      // Log success to AggregatorLog table
      await prisma.aggregatorLog.create({
        data: {
          id: crypto.randomUUID(), 
          cityId: logCityId, // Will be null for living_cost, which is fine
          year: item.year,
          type,
          chosenSource: item.source,
          confidence: item.confidence ?? 100,
          status: 'success',
          message: `Stored ${type} for ${logCityId || item.country} (${item.year})`,
        },
      })
    } catch (err) {
      logger.error(`[Aggregator] Failed storing ${type} (Key: ${item.cityId || item.country}): ${err.message}`)
    }
  }
}

// === Main autoSync (for manual trigger) ===
export async function autoSync(type = 'living_cost') {
  logger.info(`🔁 [Aggregator] Starting manualSync for ${type}...`)

  let rawResults = []
  if (type === 'umk') {
    // --- UMK: Read from local JSON ---
    const localData = readLocalJson(`umk_${CURRENT_YEAR}.json`)
    if (localData) {
      rawResults = [{ source: 'manual_json', type: 'umk', data: localData }]
    } else {
      logger.warn(`[Aggregator] No UMK dataset found for year ${CURRENT_YEAR}. Looking for umk_${CURRENT_YEAR}.json`)
      return // Return undefined to controller
    }
  } else {
    // --- Living Cost: Read from Kaggle CSV Adapter ---
    try {
      const localData = await kaggle.fetchLivingCost(CURRENT_YEAR)
      if (localData && localData.length > 0) {
         rawResults = [{ source: 'manual_csv', type: 'living_cost', data: localData }]
      } else {
         logger.warn(`[Aggregator] No Living Cost data found for ${CURRENT_YEAR} in CSV.`)
         return [] // Return empty array
      }
    } catch (err) {
       logger.error(`[Aggregator] Failed to read Living Cost CSV: ${err.message}`)
       return // Return undefined
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
    const cacheKey = keyCombined(type, CURRENT_YEAR)
    try {
      await delCache(cacheKey) 
      await setCache(cacheKey, result, 86400 * 30) // Cache for 30 days
      await bumpVersion(type)
      logger.info(`[Aggregator] Cache updated & version bumped for ${type}`)
    } catch (e) {
      logger.warn(`[Aggregator] Could not update Redis cache: ${e.message}`)
    }
  }

  logger.info(`✅ [Aggregator] ${type} sync complete`)
  return result // Return the processed data
}