import { jest } from '@jest/globals'
import crypto from 'node:crypto'
import { prisma } from '../src/config/prisma.js'
import * as Aggregator from '../src/services/aggregator/aggregator.service.js'
import { useMockFetch } from './helpers/mockFetch.js' // ✅ fixed path

const nowISO = () => new Date().toISOString()

describe('Aggregator - partial failures across sources', () => {
  beforeEach(async () => {
    await prisma.aggregatorLog.deleteMany()
    await prisma.livingCost.deleteMany()
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('uses the successful source when another fails, stores rows, and writes logs', async () => {
    jest.spyOn(Aggregator, 'fetchAllSources').mockResolvedValue([
      { source: 'bps_ihk', type: 'living_cost', data: [
        { cityId: 'ID-JB-Bandung', year: 2025, index: 132.4, currency: 'IDR', sourceUrl: 'mock://bps' },
      ]},
      { source: 'kaggle_living_cost', type: 'living_cost', data: [] },
    ])

    const upsertSpy = jest.spyOn(prisma.livingCost, 'upsert')
    const result = await Aggregator.autoSync('living_cost')

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    expect(upsertSpy).toHaveBeenCalled()

    const logs = await prisma.aggregatorLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
    const anyLog = logs.find(l => l.type === 'living_cost')
    expect(anyLog?.status).toBe('success')
    expect(anyLog?.chosenSource).toBeTruthy()
    expect(Number(anyLog?.confidence ?? 0)).toBeGreaterThan(0)

    upsertSpy.mockRestore()
  })

  it('returns undefined when all sources fail; keeps last-known DB value', async () => {
    const bandung =
      (await prisma.city.findFirst({ where: { name: { contains: 'Bandung' } } })) ||
      (await prisma.city.create({ data: { id: crypto.randomUUID(), name: 'Bandung', province: 'Jawa Barat' } }))

    await prisma.livingCost.upsert({
      where: { cityId_year: { cityId: bandung.id, year: 2024 } },
      create: { cityId: bandung.id, year: 2024, index: 129.9, currency: 'IDR' },
      update: { index: 129.9 },
    })

    jest.spyOn(Aggregator, 'fetchAllSources').mockRejectedValue(new Error('all sources failed'))

    const start = nowISO()
    const res = await Aggregator.autoSync('living_cost')
    expect(res).toBeUndefined()

    const existing2024 = await prisma.livingCost.findUnique({
      where: { cityId_year: { cityId: bandung.id, year: 2024 } },
    })
    expect(existing2024?.index).toBe(129.9)

    const missing2025 = await prisma.livingCost.findUnique({
      where: { cityId_year: { cityId: bandung.id, year: 2025 } },
    })
    expect(missing2025).toBeNull()

    const logs = await prisma.aggregatorLog.findMany({
      where: { type: 'living_cost' },
      orderBy: { createdAt: 'desc' },
    })
    const successAfterStart = logs.find(l => l.status === 'success' && l.createdAt.toISOString() >= start)
    expect(successAfterStart).toBeUndefined()
  })
})