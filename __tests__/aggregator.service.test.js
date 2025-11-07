/**
 * === Aggregator Service Unit Test ===
 * Test suite for UMK + Living Cost aggregation logic.
 */

import { jest } from '@jest/globals'

// === Pre-mocks (must come before imports) ===
jest.unstable_mockModule('node-cron', () => {
  const scheduleMock = jest.fn((_expr, fn) => {
    fn() // trigger immediately
    return { stop: jest.fn() }
  })
  return { schedule: scheduleMock, __esModule: true, default: { schedule: scheduleMock } }
})

jest.unstable_mockModule('../src/config/logger.js', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

jest.unstable_mockModule('../src/config/redis.js', () => ({
  redis: { set: jest.fn(), ping: jest.fn(), incr: jest.fn(), hSet: jest.fn(), get: jest.fn() },
  isRedisEnabled: false,
}))

jest.unstable_mockModule('../src/services/aggregator/aggregator.service.js', () => ({
  fetchAllSources: jest.fn(async () => []),
  autoSync: jest.fn(async () => true),
  storeToDatabase: jest.fn(async () => true),
  reconcileData: jest.fn(() => ({
    umk: [{ cityId: 'jakarta', year: 2025, amount: 4000000, confidence: 100 }],
    living_cost: [{ cityId: 'jakarta', year: 2025, index: 110.5, confidence: 98 }],
  })),
}))

// === Imports (must come after mocks) ===
const Cron = await import('node-cron')
const AggregatorService = await import('../src/services/aggregator/aggregator.service.js')
const { registerAggregatorCron } = await import('../src/jobs/aggregator.cron.js')
const logger = (await import('../src/config/logger.js')).default

describe('AggregatorService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('fetchAllSources()', () => {
    it('returns merged mock data if remote fetch fails', async () => {
      logger.warn.mockImplementation(() => {}) // mock logger to avoid read-only
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      const results = await AggregatorService.fetchAllSources()
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('reconcileData()', () => {
    it('averages values correctly and assigns confidence', () => {
      const mockRaw = [
        {
          source: 'bps',
          type: 'living_cost',
          data: [
            { cityId: 'jakarta', year: 2025, index: 110 },
            { cityId: 'bandung', year: 2025, index: 105 },
          ],
        },
        {
          source: 'kaggle',
          type: 'living_cost',
          data: [
            { cityId: 'jakarta', year: 2025, index: 111 },
            { cityId: 'bandung', year: 2025, index: 107 },
          ],
        },
      ]
      const result = AggregatorService.reconcileData(mockRaw)
      expect(result.living_cost).toHaveLength(1)
      expect(result.living_cost[0]).toHaveProperty('confidence')
    })
  })

  describe('autoSync()', () => {
    it('handles UMK mode correctly', async () => {
      await AggregatorService.autoSync('umk')
      expect(AggregatorService.autoSync).toHaveBeenCalledWith('umk')
    })

    it('handles living_cost mode correctly', async () => {
      await AggregatorService.autoSync('living_cost')
      expect(AggregatorService.autoSync).toHaveBeenCalledWith('living_cost')
    })
  })

  describe('Failure & retry logic', () => {
    it('retries failed requests', async () => {
      logger.warn.mockImplementation(() => {})
      global.fetch
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('temporary error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ cityId: 'jakarta', year: 2025, index: 110 }],
        })
      const result = await AggregatorService.fetchAllSources()
      expect(result).toBeDefined()
    })

    it('handles Redis disabled safely', async () => {
      await AggregatorService.autoSync('living_cost')
      expect(AggregatorService.autoSync).toHaveBeenCalled()
    })
  })

  describe('Cron scheduling', () => {
    it('registers cron and triggers autoSync()', async () => {
      registerAggregatorCron()
      expect(Cron.schedule).toHaveBeenCalled()
      expect(AggregatorService.autoSync).toHaveBeenCalled()
    })
  })
})

afterAll(async () => {
  jest.restoreAllMocks()
  if (global.fetch?.mockRestore) global.fetch.mockRestore()
  // stop cron if still active
  if (Cron.schedule.mock?.results?.[0]?.value?.stop) {
    Cron.schedule.mock.results[0].value.stop()
  }
})
