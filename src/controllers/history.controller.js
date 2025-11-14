import { HistoryService } from '../services/history.service.js'
// We no longer need HistoryQueryDto

const service = new HistoryService()

export const getHistory = async (req, res, next) => {
  try {
    // Get the user ID from the authenticate middleware
    const userId = req.user.id

    // Call the service with just the userId
    const result = await service.getUserHistory(userId)

    res.json({ ok: true, ...result })
  } catch (err) {
    next(err)
  }
}