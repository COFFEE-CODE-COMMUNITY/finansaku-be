import { HistoryService } from '../services/history.service.js'
import { HistoryQueryDto } from '../modules/history.dto.js'

const service = new HistoryService()

export const getHistory = async (req, res, next) => {
  try {
    const dto = new HistoryQueryDto(req.query).validate()
    const result = await service.getUserHistory(req.user.id, dto)

    res.json({ ok: true, ...result })
  } catch (err) {
    next(err)
  }
}
