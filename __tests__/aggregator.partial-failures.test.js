import { prisma } from '../src/config/prisma.js'
import * as Aggregator from '../src/services/aggregator/aggregator.service.js' // <-- adjust if needed
import { useMockFetch } from './helpers/mockFetch.js'

const SRC_BPS = 'https://api.example.com/bps/ihk?city=ID-JB-Bandung&year=2025'
const SRC_KAGGLE = 'https://mock.kaggleusercontent.com/ihk/2025/Bandung.json'
const SRC_FALLBACK = 'https://cdn.example.com/fallback/ihk/2025/Bandung.json'

describe('Aggregator - partial failures across sources', () => {
  beforeEach(async () => {
    await prisma.aggregatorLog.deleteMany()
    await prisma.livingCost.deleteMany()
  })

  it('uses the successful source when one fails and logs with proper confidence', async () => {
    useMockFetch({
      [SRC_BPS]: new Error('BPS timeout'),
      [SRC_KAGGLE]: { json: { cityCode: 'ID-JB-Bandung', year: 2025, index: 132.4, sourceUrl: SRC_KAGGLE } },
      [SRC_FALLBACK]: { json: { cityCode: 'ID-JB-Bandung', year: 2025, index: 131.8, sourceUrl: SRC_FALLBACK } },
    })

    const upsertSpy = jest.spyOn(prisma.livingCost, 'upsert')
    const result = await Aggregator.autoSync('living_cost')

    expect(result.success).toBe(true)
    expect(upsertSpy).toHaveBeenCalledTimes(1)

    const logs = await prisma.aggregatorLog.findMany({ orderBy: { createdAt: 'desc' }, take: 1 })
    expect(logs[0]?.status).toBe('success')
    expect(logs[0]?.chosenSource).toBeDefined()
    expect(Number(logs[0]?.confidence ?? 0)).toBeGreaterThan(0)

    upsertSpy.mockRestore()
  })

  it('falls back to last-known DB values if all sources fail', async () => {
    const bandung = await prisma.city.findFirst({ where: { name: { contains: 'Bandung' } } }) 
      ?? await prisma.city.create({ data: { id: crypto.randomUUID(), name: 'Bandung', province: 'Jawa Barat' } })

    await prisma.livingCost.upsert({
      where: { cityId_year: { cityId: bandung.id, year: 2024 } },
      create: { cityId: bandung.id, year: 2024, index: 129.9, currency: 'IDR' },
      update: { index: 129.9 },
    })

    useMockFetch({
      [SRC_BPS]: new Error('BPS down'),
      [SRC_KAGGLE]: new Error('Kaggle 403'),
      [SRC_FALLBACK]: { ok: false, status: 503, body: { error: 'maint' } },
    })

    const res = await Aggregator.autoSync('living_cost')
    expect(res.success).toBe(true)
    expect((res.decisions?.strategy || res.message || '').toLowerCase()).toMatch(/fallback|last/)
  })
})
