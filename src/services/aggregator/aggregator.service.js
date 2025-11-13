import { prisma } from '../../config/prisma.js'
import logger from '../../config/logger.js'
import { redis, isRedisEnabled } from '../../config/redis.js'
import { delCache, bumpVersion, setCache, keyCombined } from '../../utils/cache.js'
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

// === Store normalized data (MODIFIED TO TRACK CHANGES AND LOG SUMMARY) ===
export async function storeToDatabase(entries = [], type = 'umk') {
  let createdCount = 0
  let updatedCount = 0
  let failedCount = 0

  for (const item of entries) {
    let logCityId = null
    try {
      if (type === 'umk') {
        // --- UMK Storage ---
        let cityId = item.cityId
        // 1. Resolve city name to city UUID
        const city = await prisma.city.findFirst({
          where: { name: { equals: cityId, mode: 'insensitive' } }
        })

        if (!city) {
          logger.warn(`[Aggregator] Skipping UMK entry: Could not find city ID for name "${item.cityId}"`)
          continue // Skip this record
        }

        cityId = city.id // Replace name with UUID
        logCityId = city.id

        // 2. Check if record exists
        const existingRecord = await prisma.uMK.findUnique({
          where: { cityId_year: { cityId: cityId, year: item.year } },
        })

        if (existingRecord) {
            // If the amount is different, update and count it.
            if (existingRecord.amount.toNumber() !== item.amount) {
                await prisma.uMK.update({
                    where: { cityId_year: { cityId: cityId, year: item.year } },
                    data: { amount: item.amount },
                })
                updatedCount++
            }
        } else {
            // 3. Create new record
            await prisma.uMK.create({
                data: {
                    id: crypto.randomUUID(),
                    cityId: cityId,
                    year: item.year,
                    amount: item.amount,
                },
            })
            createdCount++
        }
      } else if (type === 'living_cost') {
        // --- LivingCost Storage (by Year only, matching new schema) ---
        // The unique key is now just 'year'
        const existingRecord = await prisma.livingCost.findUnique({
          where: { year: item.year },
        })

        if (existingRecord) {
            // If the index is different, update and count it.
            if (existingRecord.index.toNumber() !== item.index) {
                await prisma.livingCost.update({
                  where: { year: item.year },
                  data: {
                    index: item.index,
                    currency: item.currency ?? 'IDR',
                    sourceUrl: item.sourceUrl || null,
                  },
                })
                updatedCount++
            }
        } else {
            // Create new record
            await prisma.livingCost.create({
              data: {
                id: crypto.randomUUID(),
                year: item.year,
                index: item.index,
                currency: item.currency ?? 'IDR',
                sourceUrl: item.sourceUrl || null,
              },
            })
            createdCount++
        }
      }
    } catch (err) {
      logger.error(`[Aggregator] Failed storing ${type} (Key: ${item.cityId || item.country}): ${err.message}`)
      failedCount++

      // Log failure to AggregatorLog table (failures are logged per-item)
      await prisma.aggregatorLog.create({
        data: {
          id: crypto.randomUUID(),
          cityId: logCityId,
          year: item.year,
          type,
          chosenSource: item.source,
          confidence: item.confidence ?? 100,
          status: 'failed',
          message: `Failed storing: ${err.message}`,
        },
      })
    }
  }

  // Create a single summary log entry for the entire operation
  const totalProcessed = entries.length
  const unchangedCount = totalProcessed - createdCount - updatedCount - failedCount
  const message = `Processed ${totalProcessed} records: ${createdCount} created, ${updatedCount} updated, ${unchangedCount} unchanged, ${failedCount} failed.`

  await prisma.aggregatorLog.create({
      data: {
          id: crypto.randomUUID(),
          year: CURRENT_YEAR,
          type,
          chosenSource: 'manual_sync',
          confidence: 100,
          status: failedCount > 0 ? 'partial_success' : 'success',
          message: message,
      },
  })

  return { createdCount, updatedCount, totalProcessed, failedCount }
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
      // Return a counts object for consistency
      return { createdCount: 0, updatedCount: 0, totalProcessed: 0, failedCount: 0 }
    }
  } else {
    // --- Living Cost: Read from Kaggle CSV Adapter ---
    try {
      const localData = await kaggle.fetchLivingCost(CURRENT_YEAR)
      if (localData && localData.length > 0) {
         rawResults = [{ source: 'manual_csv', type: 'living_cost', data: localData }]
      } else {
         logger.warn(`[Aggregator] No Living Cost data found for ${CURRENT_YEAR} in CSV.`)
         return { createdCount: 0, updatedCount: 0, totalProcessed: 0, failedCount: 0 } // Return counts object
      }
    } catch (err) {
       logger.error(`[Aggregator] Failed to read Living Cost CSV: ${err.message}`)
       return { createdCount: 0, updatedCount: 0, totalProcessed: 0, failedCount: 0 } // Return counts object
    }
  }

  const { umk, living_cost } = reconcileData(rawResults)
  const result = type === 'umk' ? umk : living_cost

  if (result.length) {
    const counts = await storeToDatabase(result, type) // <-- Capture the new counts object

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

    // Final detailed log (replaces the old simple logger.info)
    const unchangedCount = counts.totalProcessed - counts.createdCount - counts.updatedCount - counts.failedCount
    logger.info(`✅ [Aggregator] ${type} sync complete. ${counts.createdCount} created, ${counts.updatedCount} updated, ${unchangedCount} unchanged, ${counts.failedCount} failed.`)

    return counts // Return the processed data
  } else {
    logger.warn(`[Aggregator] No data reconciled for ${type}.`)
    return { createdCount: 0, updatedCount: 0, totalProcessed: 0, failedCount: 0 }
  }
}