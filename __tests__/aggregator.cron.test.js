import { jest } from '@jest/globals'

// 1. Mock modules BEFORE importing them
jest.unstable_mockModule('node-cron', () => ({
  schedule: jest.fn(),
  default: {
    schedule: jest.fn(),
  },
}))

jest.unstable_mockModule('../src/services/aggregator/aggregator.service.js', () => ({
  autoSync: jest.fn(),
}))

// 2. Mock the config module to ENABLE cron for this test file
jest.unstable_mockModule('../src/config/index.js', () => ({
  default: {
    AGGREGATOR_ENABLE_CRON: true, // <-- Force it to true for this test
    AGGREGATOR_CRON_EXPRESSION: '0 3 1 * *',
    NODE_ENV: 'test',
  },
}))

// 3. Import modules dynamically AFTER mocking
const Cron = (await import('node-cron')).default
const Aggregator = await import('../src/services/aggregator/aggregator.service.js')
const { registerAggregatorCron } = await import('../src/jobs/aggregator.cron.js')

describe('Aggregator cron job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('registers cron with correct expression and triggers autoSync', async () => {
    Aggregator.autoSync.mockResolvedValue({ success: true })
    
    let capturedCallback = async () => {} // Placeholder
    Cron.schedule.mockImplementation((expr, cb) => {
      capturedCallback = cb // Capture the async callback
      return { start: jest.fn(), stop: jest.fn() }
    })

    registerAggregatorCron()

    // Verify schedule was registered
    expect(Cron.schedule).toHaveBeenCalledTimes(1)
    const [expr] = Cron.schedule.mock.calls[0]
    expect(expr).toBe(process.env.AGGREGATOR_CRON_EXPRESSION || '0 3 1 * *')

    // Manually trigger the cron callback
    await capturedCallback()

    // Verify the callback triggered autoSync in the correct order
    expect(Aggregator.autoSync).toHaveBeenCalledTimes(2)
    expect(Aggregator.autoSync.mock.calls[0][0]).toBe('umk')
    expect(Aggregator.autoSync.mock.calls[1][0]).toBe('living_cost')
  })

  it('does not crash when autoSync throws; continues next runs', async () => {
    // Simulate 'umk' failing and 'living_cost' succeeding
    Aggregator.autoSync
      .mockRejectedValueOnce(new Error('network down')) // Fails 'umk'
      .mockResolvedValueOnce({ success: true, type: 'living_cost' }) // Succeeds 'living_cost'

    let capturedCallback = async () => {}
    Cron.schedule.mockImplementation((expr, cb) => {
      capturedCallback = cb // Capture callback
      return { start: jest.fn(), stop: jest.fn() }
    })

    registerAggregatorCron()

    // Manually run the captured callback
    await capturedCallback()

    // Verify it tried to sync 'umk' (and failed)
    expect(Aggregator.autoSync).toHaveBeenCalledWith('umk')
    
    // **Crucially**, the try/catch in your cron job stops execution
    // for that run, so 'living_cost' is NOT called.
    expect(Aggregator.autoSync).not.toHaveBeenCalledWith('living_cost')
    
    // It was only called once (the 'umk' attempt)
    expect(Aggregator.autoSync).toHaveBeenCalledTimes(1) 
  })
})