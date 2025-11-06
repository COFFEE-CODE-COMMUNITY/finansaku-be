import fetch from 'node-fetch'
import { withRetry } from '../utils/retry.js'
import { normalizeUMKRow, normalizeLivingCostRow } from '../utils/normalize.js'

const TIMEOUT = Number(process.env.AGGREGATOR_HTTP_TIMEOUT_MS || 8000)

export const kemnaker = {
  name: 'kemnaker',

  async fetchUMK(year) {
    // Placeholder: if no official API, you’ll parse a CSV/HTML you host or manual JSON.
    const url = `https://data.your-source/kemnaker/umk-${year}.json`
    const res = await withRetry(async () => {
      const ctl = new AbortController()
      const t = setTimeout(()=>ctl.abort(), TIMEOUT)
      const r = await fetch(url, { signal: ctl.signal })
      clearTimeout(t)
      if (!r.ok) throw new Error(`kemnaker umk ${year} ${r.status}`)
      return r.json()
    })
    return res.map(normalizeUMKRow)
  },

  async fetchLivingCost(year) {
    // Often Kemnaker doesn’t publish IHK—skip or map if available.
    return [] // no data
  },
}
