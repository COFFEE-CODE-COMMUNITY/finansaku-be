import { prisma } from '../../config/prisma.js'
import logger from '../../config/logger.js'
import { redis, isRedisEnabled } from '../../config/redis.js'

import { delCache, bumpVersion, setCache, keyCombined } from '../../utils/cache.js'
import crypto from 'node:crypto'

// === Adapters ===
// Used to fetch external or local CSV data sources
import { livingCost as livingCostAdapter } from './adapters/livingcost.adapter.js'
import { umk as umkAdapter } from './adapters/umk.adapter.js'

// === Environment Variables ===
const CURRENT_YEAR = new Date().getFullYear()

// === Normalizers ===
// Adapt already-normalized rows from adapters into the reconciler shape
function normalizeUMKData(source, raw, targetYear) {
  if (!Array.isArray(raw)) return []
  return raw
    .map(row => ({
      // normalizeUMKRow has already coerced types
      cityId: String(row.cityName).trim(), // Use city name as the key
      year: row.year || targetYear,        // Use targetYear as fallback
      amount: row.amount,
      source,
      sourceUrl: row.sourceUrl || null,
    }))
    .filter(item => item.cityId && Number.isFinite(item.amount) && item.amount > 0)
}

function normalizeLivingCostData(source, raw, targetYear) {
  if (!Array.isArray(raw)) return []

  return raw
    .map(row => ({
      // normalizeLivingCostRow has already coerced types & percentages
      country: String(row.country).trim(), // Use country as the key
      year: row.year || targetYear,        // Use targetYear as fallback
      currency: row.currency || 'IDR',

      avgNetSalary: row.avgNetSalary ?? null,
      familyOfFourExclRent: row.familyOfFourExclRent ?? null,
      singlePersonExclRent: row.singlePersonExclRent ?? null,

      restaurantsPct: row.restaurantsPct ?? null,
      marketsPct: row.marketsPct ?? null,
      transportationPct: row.transportationPct ?? null,
      utilitiesPct: row.utilitiesPct ?? null,
      rentPct: row.rentPct ?? null,
      clothingPct: row.clothingPct ?? null,
      sportsLeisurePct: row.sportsLeisurePct ?? null,
      buyApartmentPct: row.buyApartmentPct ?? null,

      source,
    }))
    .filter(item => item.country)
}

// === Simplified reconciliation logic ===
function reconcileData(rawResults = [], targetYear) {
  const buckets = { umk: new Map() }
  const livingCostEntries = []

  for (const { source, type, data } of rawResults) {
    if (type === 'living_cost') {
      // For living_cost we trust the single CSV source:
      const normalized = normalizeLivingCostData(source, data, targetYear)
      // Optionally attach confidence
      livingCostEntries.push(
        ...normalized.map(entry => ({
          ...entry,
          confidence: 100,
        }))
      )
      continue
    }

    // === UMK path (still uses voting/averaging) ===
    const normalized = normalizeUMKData(source, data, targetYear)
    const target = buckets.umk

    for (const entry of normalized) {
      const key = `${entry.cityId.toLowerCase()}-${entry.year}`

      if (!target.has(key)) {
        target.set(key, {
          ...entry,
          votes: [{ source, value: entry.amount }],
        })
      } else {
        target.get(key).votes.push({
          source,
          value: entry.amount,
        })
      }
    }
  }

  const finalizeUMK = map => {
    const out = []
    for (const [, rec] of map) {
      const values = rec.votes
        .map(v => Number(v.value))
        .filter(v => Number.isFinite(v))
      if (!values.length) continue

      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const confidence = 100 // Manual data is trusted

      out.push({ ...rec, amount: Math.round(avg), confidence })
    }
    return out
  }

  return {
    umk: finalizeUMK(buckets.umk),
    // living_cost already normalized; no voting/averaging needed
    living_cost: livingCostEntries,
  }
}

// === Store normalized data ===
export async function storeToDatabase(entries = [], type = 'umk', targetYear) {
  let createdCount = 0
  let updatedCount = 0
  let failedCount = 0

  for (const item of entries) {
    let logCityId = null
    try {
      if (type === 'umk') {
        // === UMK Storage ===
        let cityId = item.cityId
        // 1. Resolve city name to city UUID
        const city = await prisma.city.findFirst({
          where: { name: { equals: cityId, mode: 'insensitive' } },
        })

        if (!city) {
          logger.warn(
            `[Aggregator] Skipping UMK entry: Could not find city ID for name "${item.cityId}"`
          )
          continue // Skip this record
        }

        cityId = city.id // Replace name with UUID
        logCityId = city.id

        // 2. Check if record exists
        const existingRecord = await prisma.uMK.findUnique({
          where: { cityId_year: { cityId, year: item.year } },
        })

        if (existingRecord) {
          // If the amount is different, update and count it.
          if (existingRecord.amount.toNumber() !== item.amount) {
            await prisma.uMK.update({
              where: { cityId_year: { cityId, year: item.year } },
              data: { amount: item.amount },
            })
            updatedCount++
          }
        } else {
          // 3. Create new record
          await prisma.uMK.create({
            data: {
              id: crypto.randomUUID(),
              cityId,
              year: item.year,
              amount: item.amount,
            },
          })
          createdCount++
        }
      } else if (type === 'living_cost') {
        // === LivingCost Storage (by country + year, with percentages) ===
        const country = item.country
        const year = item.year ?? targetYear

        const existingRecord = await prisma.livingCost.findUnique({
          where: {
            country_year: {
              country,
              year,
            },
          },
        })

        const buildData = src => ({
          country,
          year,
          currency: src.currency || 'IDR',

          avgNetSalary: src.avgNetSalary ?? null,
          familyOfFourExclRent: src.familyOfFourExclRent ?? null,
          singlePersonExclRent: src.singlePersonExclRent ?? null,

          restaurantsPct: src.restaurantsPct ?? null,
          marketsPct: src.marketsPct ?? null,
          transportationPct: src.transportationPct ?? null,
          utilitiesPct: src.utilitiesPct ?? null,
          rentPct: src.rentPct ?? null,
          clothingPct: src.clothingPct ?? null,
          sportsLeisurePct: src.sportsLeisurePct ?? null,
          buyApartmentPct: src.buyApartmentPct ?? null,
        })

        if (existingRecord) {
          // Check if anything actually changed
          const fieldsToCheck = [
            'avgNetSalary',
            'familyOfFourExclRent',
            'singlePersonExclRent',
            'restaurantsPct',
            'marketsPct',
            'transportationPct',
            'utilitiesPct',
            'rentPct',
            'clothingPct',
            'sportsLeisurePct',
            'buyApartmentPct',
          ]

          let hasDiff = false
          for (const field of fieldsToCheck) {
            const oldVal = existingRecord[field]
            const newVal = item[field]

            const oldNum =
              oldVal === null || oldVal === undefined
                ? null
                : oldVal.toNumber()
            const newNum =
              newVal === null || newVal === undefined
                ? null
                : Number(newVal)

            if (oldNum !== newNum) {
              hasDiff = true
              break
            }
          }

          if (hasDiff) {
            await prisma.livingCost.update({
              where: {
                country_year: {
                  country,
                  year,
                },
              },
              data: buildData(item),
            })
            updatedCount++
          }
        } else {
          await prisma.livingCost.create({
            data: {
              id: crypto.randomUUID(),
              ...buildData(item),
            },
          })
          createdCount++
        }
      }
    } catch (err) {
      logger.error(
        `[Aggregator] Failed storing ${type} (Key: ${item.cityId || item.country}): ${err.message}`
      )
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
  const unchangedCount =
    totalProcessed - createdCount - updatedCount - failedCount
  const message = `Processed ${totalProcessed} records: ${createdCount} created, ${updatedCount} updated, ${unchangedCount} unchanged, ${failedCount} failed.`

  await prisma.aggregatorLog.create({
    data: {
      id: crypto.randomUUID(),
      year: targetYear, // Use targetYear here
      type,
      chosenSource: 'manual_sync',
      confidence: 100,
      status: failedCount > 0 ? 'partial_success' : 'success',
      message,
    },
  })

  return { createdCount, updatedCount, totalProcessed, failedCount }
}

// === Main autoSync (for manual trigger) ===
export async function autoSync(type = 'living_cost', targetYear = CURRENT_YEAR) {
  logger.info(
    `🔁 [Aggregator] Starting manualSync for ${type} (Year: ${targetYear})...`
  )

  let rawResults = []

  if (type === 'umk') {
    // === UMK: Read from UMK CSV Adapter ===
    try {
      const localData = await umkAdapter.fetchUMK(targetYear)
      if (localData && localData.length > 0) {
        rawResults = [
          { source: 'manual_csv_umk', type: 'umk', data: localData },
        ]
      } else {
        logger.warn(
          `[Aggregator] No UMK dataset found for year ${targetYear}. Looking for umk_${targetYear}.csv`
        )
        return {
          createdCount: 0,
          updatedCount: 0,
          totalProcessed: 0,
          failedCount: 0,
        }
      }
    } catch (err) {
      logger.error(`[Aggregator] Failed to read UMK CSV: ${err.message}`)
      return {
        createdCount: 0,
        updatedCount: 0,
        totalProcessed: 0,
        failedCount: 0,
      }
    }
  } else {
    // === Living Cost: Read from CSV Adapter ===
    try {
      const localData = await livingCostAdapter.fetchLivingCost(targetYear)
      if (localData && localData.length > 0) {
        rawResults = [
          {
            source: 'manual_csv_livingcost',
            type: 'living_cost',
            data: localData,
          },
        ]
      } else {
        logger.warn(
          `[Aggregator] No Living Cost data found for ${targetYear} in CSV.`
        )
        return {
          createdCount: 0,
          updatedCount: 0,
          totalProcessed: 0,
          failedCount: 0,
        }
      }
    } catch (err) {
      logger.error(
        `[Aggregator] Failed to read Living Cost CSV: ${err.message}`
      )
      return {
        createdCount: 0,
        updatedCount: 0,
        totalProcessed: 0,
        failedCount: 0,
      }
    }
  }

  // Pass targetYear to reconcileData
  const { umk, living_cost } = reconcileData(rawResults, targetYear)
  const result = type === 'umk' ? umk : living_cost

  if (result.length) {
    // Pass targetYear to storeToDatabase
    const counts = await storeToDatabase(result, type, targetYear)

    // === Cache write & invalidate old ===
    if (isRedisEnabled && redis?.isReady) {
      const cacheKey = keyCombined(type, targetYear)
      try {
        await delCache(cacheKey)
        await setCache(cacheKey, result, 86400 * 30) // Cache for 30 days
        await bumpVersion(type)
        logger.info(
          `[Aggregator] Cache updated & version bumped for ${type}`
        )
      } catch (e) {
        logger.warn(
          `[Aggregator] Could not update Redis cache: ${e.message}`
        )
      }
    }

    const unchangedCount =
      counts.totalProcessed -
      counts.createdCount -
      counts.updatedCount -
      counts.failedCount

    logger.info(
      `✅ [Aggregator] ${type} sync complete. ${counts.createdCount} created, ${counts.updatedCount} updated, ${unchangedCount} unchanged, ${counts.failedCount} failed.`
    )

    return counts
  } else {
    logger.warn(`[Aggregator] No data reconciled for ${type}.`)
    return {
      createdCount: 0,
      updatedCount: 0,
      totalProcessed: 0,
      failedCount: 0,
    }
  }
}
