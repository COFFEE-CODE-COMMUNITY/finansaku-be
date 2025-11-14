import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'
import { normalizeLivingCostRow } from '../utils/normalize.js'

export const livingCost = {
  name: 'livingcost',

  async fetchLivingCost(year) {
    const CSV_FILE_NAME = `living_cost_${year}.csv`
    const csvPath = path.join(process.cwd(), 'src/services/aggregator/data', CSV_FILE_NAME)

    // Attempt to read CSV file
    const csv = await fs.readFile(csvPath, 'utf8').catch(() => {
      console.warn(`[LivingCostAdapter] CSV file not found: ${CSV_FILE_NAME}`)
      return ''
    })

    if (!csv) return []

    // Parse CSV content
    const { data } = Papa.parse(csv, { header: true })

    // Normalize and filter data for Indonesia
    return data
      .filter(row => row.Country === 'Indonesia')
      .map(row =>
        normalizeLivingCostRow({
          country: row.Country,
          year,
          index: row['Cost of Living Index'],
          sourceUrl:
            'https://www.kaggle.com/datasets/myrios/cost-of-living-index-by-country-by-number-2024',
        })
      )
  },
}
