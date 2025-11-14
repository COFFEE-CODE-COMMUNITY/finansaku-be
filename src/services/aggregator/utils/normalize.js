// Normalize UMK row
export function normalizeUMKRow(row) {
  return {
    cityName: row.cityName,
    year: Number(row.year),
    amount: Number(row.amount),
    sourceUrl: row.sourceUrl || null,
  }
}

// Normalize Living Cost row
export function normalizeLivingCostRow(row) {
  return {
    country: row.country,
    year: Number(row.year),
    index: Number(row.index),
    sourceUrl: row.sourceUrl || null,
  }
}
