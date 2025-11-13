import config from '../../../config/index.js'

export async function withRetry(fn, {
  retries = Number(config.AGGREGATOR_MAX_RETRIES || 3),
  base = Number(config.AGGREGATOR_BACKOFF_BASE_MS || 500)
} = {}) {
  let lastErr
  for (let i = 0; i <= retries; i++) {
    try { return await fn() } catch (err) {
      lastErr = err
      if (i === retries) break
      const delay = base * 2 ** i + Math.floor(Math.random() * 250)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastErr
}
