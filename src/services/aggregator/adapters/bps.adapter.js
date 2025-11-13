import fetch from 'node-fetch'
import { withRetry } from '../utils/retry.js'
import { normalizeLivingCostRow } from '../utils/normalize.js'
import config from '../../../config/index.js'

const TIMEOUT = Number(config.AGGREGATOR_HTTP_TIMEOUT_MS || 8000)

export const bps = {
  name: 'bps',
  async fetchUMK() { return [] }, // typically N/A at BPS

  async fetchLivingCost(year) {
    const url = `https://api.your-proxy/bps/ihk?year=${year}` // use your proxy if needed
    const data = await withRetry(async () => {
      const ctl = new AbortController()
      const t = setTimeout(()=>ctl.abort(), TIMEOUT)
      const r = await fetch(url, { signal: ctl.signal })
      clearTimeout(t)
      if (!r.ok) throw new Error(`bps ihk ${year} ${r.status}`)
      return r.json()
    })
    return data.rows.map(normalizeLivingCostRow)
  },
}
