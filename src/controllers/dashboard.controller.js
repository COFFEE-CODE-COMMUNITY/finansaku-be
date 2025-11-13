import { DashboardService } from '../services/dashboard.service.js'

const service = new DashboardService()

export const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const data = await service.getDashboardData(userId)

    res.json({ ok: true, data })
  } catch (err) {
    console.error("❌ Error in getUserDashboard:", err);
    res
      .status(500)
      .json({ ok: false, message: "Gagal memuat dashboard", error: err.message });
  }
}