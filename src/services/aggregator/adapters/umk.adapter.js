import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'
import { normalizeUMKRow } from '../utils/normalize.js'

export const umk = {
  name: 'umk',

  async fetchUMK(year) {
    const CSV_FILE_NAME = `umk_${year}.csv`
    const csvPath = path.join(process.cwd(), 'src/services/aggregator/data', CSV_FILE_NAME)

    // Attempt to read CSV file
    const csv = await fs.readFile(csvPath, 'utf8').catch(() => {
      console.warn(`[UMKAdapter] CSV file not found: ${CSV_FILE_NAME}`)
      return ''
    })

    if (!csv) return []

    // Parse CSV content
    const { data } = Papa.parse(csv, { header: true })

    // Normalize
    return data.map(row => normalizeUMKRow(row))
  },
}
