import { jest } from '@jest/globals'
import * as Cron from 'node-cron'
import * as Aggregator from '../src/services/aggregator/aggregator.service.js'
import { registerAggregatorCron } from '../src/jobs/aggregator.cron.js'

jest.mock('node-cron', () => ({
  schedule: jest.fn(() => {
    const cbRef = { cb: null }
    return {
      start: jest.fn(function () { cbRef.cb && cbRef.cb() }),
      stop: jest.fn(),
      _setCb: (cb) => { cbRef.cb = cb },
      _getCb: () => cbRef.cb,
    }
  }),
}))

describe('Aggregator cron job', () => {
  beforeEach(() => jest.clearAllMocks())

  it('registers cron with correct expression and triggers autoSync', async () => {
    const autoSpy = jest.spyOn(Aggregator, 'autoSync')
      .mockResolvedValue({ success: true, type: 'living_cost' })

    registerAggregatorCron()
    expect(Cron.schedule).toHaveBeenCalledTimes(1)
    const [expr, cb] = Cron.schedule.mock.calls[0]
    expect(expr).toBe(process.env.AGGREGATOR_CRON_EXPRESSION || '0 3 1 * *')

    const job = Cron.schedule.mock.results[0].value
    job._setCb(cb)
    job.start()

    expect(autoSpy).toHaveBeenCalledWith('living_cost')
  })

  it('does not crash when autoSync throws; continues next runs', async () => {
    const autoSpy = jest.spyOn(Aggregator, 'autoSync')
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ success: true, type: 'living_cost' })

    registerAggregatorCron()
    const [, cb] = Cron.schedule.mock.calls[0]
    const job = Cron.schedule.mock.results[0].value
    job._setCb(cb)

    await expect(cb()).resolves.toBeUndefined()
    await expect(cb()).resolves.toBeUndefined()
    expect(autoSpy).toHaveBeenCalledTimes(2)
  })
})
