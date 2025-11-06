import { DashboardService } from '../services/dashboard.service.js'

const service = new DashboardService()

export const getUserDashboard = async (req, res, next) => {
  try {
    const data = await service.getUserDashboard(req.user.id)
    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}
