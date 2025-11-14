import { jest } from '@jest/globals'
import crypto from 'node:crypto'
import { prisma } from '../src/config/prisma.js'

// === Mock the aggregator service ===
const mockFetchAllSources = jest.fn()
const mockAutoSync = jest.fn(async () => []) 

jest.unstable_mockModule('../src/services/aggregator/aggregator.service.js', () => ({
  autoSync: mockAutoSync,
  fetchAllSources: mockFetchAllSources,
}))

// Removed the 'useMockFetch' import
const Aggregator = await import('../src/services/aggregator/aggregator.service.js')

const nowISO = () => new Date().toISOString()

describe('Aggregator - partial failures across sources', () => {
  beforeEach(async () => {
    await prisma.aggregatorLog.deleteMany()
    await prisma.livingCost.deleteMany()
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('uses the successful source when another fails, stores rows, and writes logs', async () => {
    mockAutoSync.mockResolvedValue([
      { cityId: 'ID-JB-Bandung', year: 2025, index: 132.4, sourceUrl: 'mock://bps' }
    ])

    mockFetchAllSources.mockResolvedValue([
      { source: 'bps_ihk', type: 'living_cost', data: []},
      { source: 'kaggle_living_cost', type: 'living_cost', data: [] },
    ])

    const result = await Aggregator.autoSync('living_cost')

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns undefined when all sources fail; keeps last-known DB value', async () => {
    const bandung =
      (await prisma.city.findFirst({ where: { name: { contains: 'Bandung' } } })) ||
      (await prisma.city.create({ data: { id: crypto.randomUUID(), name: 'Bandung' } }))

    await prisma.livingCost.upsert({
      where: { cityId_year: { cityId: bandung.id, year: 2024 } },
      create: { id: crypto.randomUUID(), cityId: bandung.id, year: 2024, index: 129.9 },
      update: { index: 129.9 },
    })
    
    mockAutoSync.mockResolvedValue(undefined) 
    mockFetchAllSources.mockRejectedValue(new Error('all sources failed'))

    const start = nowISO()
    const res = await Aggregator.autoSync('living_cost')

    expect(res).toBeUndefined() 

    const existing2024 = await prisma.livingCost.findUnique({
      where: { cityId_year: { cityId: bandung.id, year: 2024 } },
    })

    expect(Number(existing2024?.index)).toBe(129.9)
  })
})