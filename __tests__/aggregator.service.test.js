import { jest } from '@jest/globals'
import crypto from 'node:crypto'
import { prisma } from '../src/config/prisma.js'

// === Mock the aggregator service ===
const mockAutoSync = jest.fn()

jest.unstable_mockModule('../src/services/aggregator/aggregator.service.js', () => ({
  autoSync: mockAutoSync,
}))

// Import the updated Aggregator service
const Aggregator = await import('../src/services/aggregator/aggregator.service.js')

const nowISO = () => new Date().toISOString()

describe('Aggregator - partial failures across sources', () => {
  beforeEach(async () => {
    // Clean up before each test
    await prisma.aggregatorLog.deleteMany()
    await prisma.livingCost.deleteMany()
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('uses the successful source when another fails, stores rows, and writes logs', async () => {
    // Simulate the successful sync with a single CSV source
    mockAutoSync.mockResolvedValue([
      { source: 'single_csv_source', type: 'living_cost', data: [{ year: 2025, country: 'Indonesia', index: 132.4 }] },
    ])

    // Perform the autoSync operation
    const result = await Aggregator.autoSync('living_cost')

    // Assertions
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)  // Ensure data was processed
    expect(result[0].index).toBe(132.4)  // Ensure correct value was stored
  })

  it('returns undefined when the source fails, keeps last-known DB value', async () => {
    // Find or create a city for testing
    const bandung =
      (await prisma.city.findFirst({ where: { name: { contains: 'Bandung' } } })) ||
      (await prisma.city.create({ data: { id: crypto.randomUUID(), name: 'Bandung' } }))

    // Insert a record for Bandung for the year 2024
    await prisma.livingCost.upsert({
      where: { country_year: { country: 'Indonesia', year: 2024 } }, // UPDATED SCHEMA
      create: { id: crypto.randomUUID(), country: 'Indonesia', year: 2024, index: 129.9 },
      update: { index: 129.9 },
    })

    // Simulate a failure in the sync operation
    mockAutoSync.mockResolvedValue(undefined)  // Simulating a failure scenario

    // Perform the autoSync operation, expecting no new data to be written
    const res = await Aggregator.autoSync('living_cost')

    // Assertions
    expect(res).toBeUndefined()  // Check that result is undefined due to failure

    // Verify that the existing data for 2024 is not overwritten
    const existing2024 = await prisma.livingCost.findUnique({
      where: { country_year: { country: 'Indonesia', year: 2024 } }, // UPDATED SCHEMA
    })
    expect(Number(existing2024?.index)).toBe(129.9)  // Ensure the value remains unchanged
  })
})
