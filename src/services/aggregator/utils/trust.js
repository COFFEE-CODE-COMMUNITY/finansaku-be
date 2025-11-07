import config from '../../../config/index.js'

const DEFAULT_WEIGHTS = JSON.parse(config.AGGREGATOR_SOURCE_WEIGHTS || '{"kemnaker":0.6,"bps":0.3,"kaggle":0.1}')

function madFilter(values) {
  if (values.length < 3) return values
  const median = values.toSorted((a,b)=>a-b)[Math.floor(values.length/2)]
  const deviations = values.map(v => Math.abs(v - median))
  const mad = deviations.toSorted((a,b)=>a-b)[Math.floor(values.length/2)] || 0
  const k = 3.5 // Tukey-ish
  return values.filter(v => mad === 0 ? true : Math.abs(v - median) / mad <= k)
}

export function combineCityYear(records, { type }) {
  // records: [{source, value, url}]
  const weights = DEFAULT_WEIGHTS
  const entries = records.filter(r => r.value != null)
  if (!entries.length) return { value: null, confidence: 0, chosen: null }

  // Outlier filter per city/year
  const filtered = madFilter(entries.map(e => e.value))
  const filteredEntries = entries.filter(e => filtered.includes(e.value))

  // Majority vote (mode by rounded bucket), then weighted mean as tiebreaker
  const buckets = new Map()
  for (const e of filteredEntries) {
    const key = type === 'umk' ? Math.round(e.value / 50000) : Math.round(e.value * 100) // bucketization
    buckets.set(key, (buckets.get(key) || 0) + 1)
  }
  const maxBucketCount = Math.max(...buckets.values())
  const majorityKeys = [...buckets.entries()].filter(([,c]) => c === maxBucketCount).map(([k]) => k)

  let chosenValue
  if (majorityKeys.length === 1) {
    const key = majorityKeys[0]
    const inBucket = filteredEntries.filter(e => (type === 'umk'
      ? Math.round(e.value / 50000) === key
      : Math.round(e.value * 100) === key))
    const sumW = inBucket.reduce((s, e) => s + (weights[e.source] || 0.05), 0)
    chosenValue = inBucket.reduce((s, e) => s + e.value * (weights[e.source] || 0.05), 0) / (sumW || inBucket.length)
  } else {
    // Weighted mean over all filtered
    const sumW = filteredEntries.reduce((s, e) => s + (weights[e.source] || 0.05), 0)
    chosenValue = filteredEntries.reduce((s, e) => s + e.value * (weights[e.source] || 0.05), 0) / (sumW || filteredEntries.length)
  }

  // Confidence: weight share of agreeing entries vs all filtered
  const agreeing = filteredEntries.filter(e => {
    const diff = Math.abs(e.value - chosenValue)
    const tol = type === 'umk' ? 50000 : 0.5 // tolerance
    return diff <= tol
  })
  const agreeWeight = agreeing.reduce((s,e)=>s+(weights[e.source]||0.05),0)
  const totalWeight = filteredEntries.reduce((s,e)=>s+(weights[e.source]||0.05),0)
  const confidence = totalWeight ? Math.min(1, agreeWeight / totalWeight) : 0.3

  return { value: type === 'umk' ? Math.round(chosenValue) : Number(chosenValue.toFixed(2)), confidence }
}
