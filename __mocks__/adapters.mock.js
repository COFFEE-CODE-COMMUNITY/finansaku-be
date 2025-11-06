export const kemnaker = {
  name: 'kemnaker',
  fetchUMK: async (year) => [{ cityName:'Kota A', year, amount: 4000000 }],
  fetchLivingCost: async () => []
}

export const bps = {
  name: 'bps',
  fetchUMK: async () => [],
  fetchLivingCost: async (year) => [{ cityName:'Kota A', year, index: 108.5, currency: 'IDR' }]
}

export const kaggle = {
  name: 'kaggle',
  fetchUMK: async (year) => [{ cityName:'Kota A', year, amount: 3950000 }],
  fetchLivingCost: async (year) => [{ cityName:'Kota A', year, index: 109.1, currency: 'IDR' }]
}
