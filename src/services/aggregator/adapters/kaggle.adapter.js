import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'
import { normalizeLivingCostRow } from '../utils/normalize.js'

// --- IMPORTANT ---
// Place your CSV file in src/services/aggregator/data/
// and name it 'kaggle_living_cost.csv'
const CSV_FILE_NAME = 'kaggle_living_cost.csv'

export const kaggle = {
  name: 'kaggle',

  async fetchLivingCost(year) {
    const csvPath = path.join(process.cwd(), 'src/services/aggregator/data', CSV_FILE_NAME)
    const csv = await fs.readFile(csvPath, 'utf8').catch(()=> '')
    if (!csv) {
      console.warn(`[KaggleAdapter] CSV file not found: ${CSV_FILE_NAME}`)
      return []
    }
    
    const { data } = Papa.parse(csv, { header: true })
    
    // Normalize the data from Cost_of_Living_Index_by_Country_2024.csv
    return data
      .filter(row => row.Country === 'Indonesia') // Filter for only Indonesia
      .map(row => normalizeLivingCostRow({
        country: row.Country, // Use 'country'
        year: row.Year || year, // Use 'Year' column or current year
        index: row['Cost of Living Index'], // Use the correct column name
        currency: 'IDR', // Assuming we are standardizing to IDR
        sourceUrl: 'https://www.kaggle.com/datasets/myrios/cost-of-living-index-by-country-by-number-2024'
      }))
  },
}