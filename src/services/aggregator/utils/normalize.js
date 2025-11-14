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
export function normalizeLivingCostRow(input) {
  const toPct = (v) =>
    v === null || v === undefined ? null : Number(Number(v).toFixed(2))

  return {
    cityId: input.cityId ?? null,         // for now, your adapter can just not set this => null
    year: Number(input.year),

    restaurantsPct: toPct(input.restaurantsPct),
    marketsPct: toPct(input.marketsPct),
    transportationPct: toPct(input.transportationPct),
    utilitiesPct: toPct(input.utilitiesPct),
    rentPct: toPct(input.rentPct),
    clothingPct: toPct(input.clothingPct),
    sportsLeisurePct: toPct(input.sportsLeisurePct),
    buyApartmentPct: toPct(input.buyApartmentPct),
  }
}

// Normalize Living Cost data
export function normalizeLivingCostData(source, raw, targetYear) {
  if (!Array.isArray(raw)) return []

  return raw
    .map(row => ({
      cityId: row.cityId ?? null,         // null = national baseline (Indonesia)
      year: row.year || targetYear,

      restaurantsPct: row.restaurantsPct ?? null,
      marketsPct: row.marketsPct ?? null,
      transportationPct: row.transportationPct ?? null,
      utilitiesPct: row.utilitiesPct ?? null,
      rentPct: row.rentPct ?? null,
      clothingPct: row.clothingPct ?? null,
      sportsLeisurePct: row.sportsLeisurePct ?? null,
      buyApartmentPct: row.buyApartmentPct ?? null,

      source,
    }))
    .filter(item => item.year)           // cityId can be null, year must exist
}
