import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'
import { normalizeUMKRow, normalizeLivingCostRow } from '../utils/normalize.js'

export const kaggle = {
  name: 'kaggle',

  async fetchUMK(year) {
    const csvPath = path.join(process.cwd(), 'data', `kaggle-umk-${year}.csv`)
    const csv = await fs.readFile(csvPath, 'utf8').catch(()=> '')
    if (!csv) return []
    const { data } = Papa.parse(csv, { header: true })
    return data.map(row => normalizeUMKRow({
      cityName: row.city,
      year,
      amount: row.umk,
      sourceUrl: 'https://www.kaggle.com/…'
    }))
  },

  async fetchLivingCost(year) {
    const csvPath = path.join(process.cwd(), 'data', `kaggle-ihk-${year}.csv`)
    const csv = await fs.readFile(csvPath, 'utf8').catch(()=> '')
    if (!csv) return []
    const { data } = Papa.parse(csv, { header: true })
    return data.map(row => normalizeLivingCostRow({
      cityName: row.city,
      year,
      index: row.cpi_index,
      currency: 'IDR',
      sourceUrl: 'https://www.kaggle.com/…'
    }))
  },
}
