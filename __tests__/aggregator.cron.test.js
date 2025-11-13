import { jest } from '@jest/globals'

// 1. Mock modules BEFORE importing them (ESM Requirement)
jest.unstable_mockModule('node-cron', () => ({
  schedule: jest.fn(),
  default: {
    schedule: jest.fn(),
  },
}))

jest.unstable_mockModule('../src/services/aggregator/aggregator.service.js', () => ({
  autoSync: jest.fn(),
}))

// 2. Import modules dynamically AFTER mocking
const Cron = await import('node-cron')
const Aggregator = await import('../src/services/aggregator/aggregator.service.js')
const { registerAggregatorCron } = await import('../src/jobs/aggregator.cron.js')

describe('Aggregator cron job', () => {
  beforeEach(() => jest.clearAllMocks())

  it('registers cron with correct expression and triggers autoSync', async () => {
    // Setup mocks
    Aggregator.autoSync.mockResolvedValue({ success: true, type: 'living_cost' })
    
    // Mock implementation for cron.schedule to capture the callback
    Cron.schedule.mockImplementation((expr, cb) => {
      // Trigger the callback immediately to simulate cron firing
      cb() 
      return { start: jest.fn(), stop: jest.fn() }
    })

    registerAggregatorCron()

    // Verify schedule was registered
    expect(Cron.schedule).toHaveBeenCalledTimes(1)
    const [expr] = Cron.schedule.mock.calls[0]
    expect(expr).toBe(process.env.AGGREGATOR_CRON_EXPRESSION || '0 3 1 * *')

    // Verify the callback triggered autoSync
    // Note: In your actual cron job, you call autoSync twice (once for 'umk', once for 'living_cost')
    expect(Aggregator.autoSync).toHaveBeenCalledWith('umk')
    expect(Aggregator.autoSync).toHaveBeenCalledWith('living_cost')
  })

  it('does not crash when autoSync throws; continues next runs', async () => {
    // Simulate one failure and one success
    Aggregator.autoSync
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ success: true, type: 'living_cost' })

    Cron.schedule.mockImplementation((expr, cb) => {
      // Execute the callback which contains the try/catch block
      // We await it to ensure the async logic completes inside the test
      return cb().then(() => ({ start: jest.fn(), stop: jest.fn() }))
    })

    await registerAggregatorCron()

    // Verify it tried to sync despite the error
    expect(Aggregator.autoSync).toHaveBeenCalledTimes(2) 
  })
})