import fetch from 'node-fetch'
import { withRetry } from '../utils/retry.js'
import { normalizeUMKRow, normalizeLivingCostRow } from '../utils/normalize.js'
import config from '../../../config/index.js'

const TIMEOUT = Number(config.AGGREGATOR_HTTP_TIMEOUT_MS || 8000)

export const kemnaker = {
  name: 'kemnaker',

  async fetchUMK(year) {
    const url = `https://data.your-source/kemnaker/umk-${year}.json`
    const res = await withRetry(async () => {
      const ctl = new AbortController()
      const t = setTimeout(() => ctl.abort(), TIMEOUT)
      const r = await fetch(url, { signal: ctl.signal })
      clearTimeout(t)
      if (!r.ok) throw new Error(`kemnaker umk ${year} ${r.status}`)
      return r.json()
    })
    return res.map((row) => normalizeUMKRow(row, year))
  },

  async fetchLivingCost(year) {
    // Kemnaker doesn't usually provide IHK data; use placeholder or normalize empty.
    const data = [] // no published dataset
    return data.map((row) => normalizeLivingCostRow(row, year))
  },
}
