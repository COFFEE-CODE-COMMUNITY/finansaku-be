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
  const toNum = (v) =>
    v === null || v === undefined || v === '' ? null : Number(v)

  const toPct = (v) =>
    v === null || v === undefined ? null : Number(v.toFixed(2))

  return {
    country: input.country,
    year: Number(input.year),
    currency: input.currency,

    avgNetSalary: toNum(input.avgNetSalary),
    familyOfFourExclRent: toNum(input.familyOfFourExclRent),
    singlePersonExclRent: toNum(input.singlePersonExclRent),

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
