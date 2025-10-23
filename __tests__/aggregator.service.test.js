/**
 * === Aggregator Service Unit Test ===
 * Test suite for UMK + Living Cost aggregation logic.
 * ----------------------------------------------------
 * Uses built-in fetch mocks and local JSON fixtures from /__mocks__.
 * Run with:
 *   $ npm test
 *   $ npx jest --runInBand --detectOpenHandles
 */

import { jest } from '@jest/globals'
import * as AggregatorService from '../src/services/aggregator/aggregator.service.js'
import logger from '../src/config/logger.js'

// === Mocks ===
jest.mock('../src/config/logger.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}))
jest.unstable_mockModule('../src/config/redis.js', () => ({
  redis: { set: jest.fn() },
  isRedisEnabled: false,
}))

describe('AggregatorService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  // === fetchAllSources() ===
  describe('fetchAllSources()', () => {
    it('returns merged mock data if remote fetch fails', async () => {
      // Force network failure to test local __mocks__ fallback
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const results = await AggregatorService.fetchAllSources()
      expect(Array.isArray(results)).toBe(true)
      expect(logger.warn).toHaveBeenCalled()
    })
  })

  // === reconcileData() ===
  describe('reconcileData()', () => {
    it('averages values correctly and assigns confidence', () => {
      const mockRaw = [
        { source: 'bps', type: 'living_cost', data: [
          { cityId: 'jakarta', year: 2025, index: 110 },
          { cityId: 'bandung', year: 2025, index: 105 },
        ]},
        { source: 'kaggle', type: 'living_cost', data: [
          { cityId: 'jakarta', year: 2025, index: 111 },
          { cityId: 'bandung', year: 2025, index: 107 },
        ]},
      ]

      const result = AggregatorService.reconcileData(mockRaw)
      expect(result.living_cost).toHaveLength(2)
      expect(result.living_cost[0]).toHaveProperty('confidence')
      expect(result.living_cost[0].index).toBeCloseTo(110.5, 1)
    })
  })

  // === autoSync('umk') — Manual Mode ===
  describe('autoSync() — manual UMK mode', () => {
    it('loads local UMK mock file and stores entries', async () => {
      const spyStore = jest.spyOn(AggregatorService, 'storeToDatabase')
        .mockResolvedValueOnce(undefined)

      await AggregatorService.autoSync('umk')

      expect(spyStore).toHaveBeenCalled()
      spyStore.mockRestore()
    })
  })

  // === autoSync('living_cost') — Cron Mode ===
  describe('autoSync() — living_cost mode', () => {
    it('calls fetchAllSources and writes to DB', async () => {
      const spyFetch = jest.spyOn(AggregatorService, 'fetchAllSources')
        .mockResolvedValueOnce([
          { source: 'bps_ihk', type: 'living_cost', data: [
            { cityId: 'jakarta', year: 2025, index: 111.2 },
          ] },
        ])

      const spyStore = jest.spyOn(AggregatorService, 'storeToDatabase')
        .mockResolvedValueOnce(undefined)

      await AggregatorService.autoSync('living_cost')

      expect(spyFetch).toHaveBeenCalled()
      expect(spyStore).toHaveBeenCalled()

      spyFetch.mockRestore()
      spyStore.mockRestore()
    })
  })
})
