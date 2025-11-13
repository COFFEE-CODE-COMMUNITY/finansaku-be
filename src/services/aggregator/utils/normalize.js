export function normalizeUMKRow(row) {
  return {
    cityName: row.cityName,
    year: Number(row.year),
    amount: Number(row.amount),
    sourceUrl: row.sourceUrl || null,
  }
}

// Corrected this function to use 'country' to match the Kaggle adapter
export function normalizeLivingCostRow(row) {
  return {
    country: row.country, // <-- Was cityName
    year: Number(row.year),
    index: Number(row.index),
    currency: row.currency || 'IDR',
    sourceUrl: row.sourceUrl || null,
  }
}
