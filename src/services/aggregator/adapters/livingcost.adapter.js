import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'
import { normalizeLivingCostRow } from '../utils/normalize.js'

const CSV_DIR = path.join(process.cwd(), 'src/services/aggregator/data')

const toNumber = (value) => {
  if (!value) return 0
  const n = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

export const livingCost = {
  name: 'livingcost',

  async fetchLivingCost(year) {
    const CSV_FILE_NAME = `living_cost_${year}.csv`
    const csvPath = path.join(CSV_DIR, CSV_FILE_NAME)

    const csv = await fs.readFile(csvPath, 'utf8').catch(() => {
      console.warn(`[LivingCostAdapter] CSV file not found: ${CSV_FILE_NAME}`)
      return ''
    })

    if (!csv) return []

    const { data } = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
    })

    return data
      .filter((row) => row.country === 'Indonesia')
      .map((row) => {
        // Meta
        const avgNetSalary        = toNumber(row.avgNetSalary)
        const familyOfFourExclRent = toNumber(row.familyOfFourExclRent)
        const singlePersonExclRent = toNumber(row.singlePersonExclRent)

        // Expense categories (all IDR)
        const restaurants    = toNumber(row.restaurants)
        const markets        = toNumber(row.markets)
        const transportation = toNumber(row.transportation)
        const utilities      = toNumber(row.utilities)
        const rent           = toNumber(row.rent)
        const clothing       = toNumber(row.clothing)
        const sports         = toNumber(row.sports)
        const buyApartment   = toNumber(row.buyApartment)

        const total =
          restaurants +
          markets +
          transportation +
          utilities +
          rent +
          clothing +
          sports +
          buyApartment

        const pct = (amount) => (total > 0 ? (amount / total) * 100 : 0)

        return normalizeLivingCostRow({
          country: row.country,
          year: Number(row.year) || year,
          currency: row.currency || 'IDR',

          avgNetSalary,
          familyOfFourExclRent,
          singlePersonExclRent,

          restaurantsPct: pct(restaurants),
          marketsPct: pct(markets),
          transportationPct: pct(transportation),
          utilitiesPct: pct(utilities),
          rentPct: pct(rent),
          clothingPct: pct(clothing),
          sportsLeisurePct: pct(sports),
          buyApartmentPct: pct(buyApartment),
        })
      })
  },
}
