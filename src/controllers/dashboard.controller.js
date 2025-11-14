import { DashboardService } from '../services/dashboard.service.js'

const service = new DashboardService()

export const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" })
    }

    // 1. Jalankan 'getDashboardData'
    const summaryData = await service.getDashboardData(userId)

    // 2. SETELAH alokasi ada, jalankan 'getTrendDataPerCategory'
    const trendData = await service.getTrendDataPerCategory(userId) 

    // 3. Gabungkan hasilnya menjadi satu objek data
    const responseData = {
      // Ambil data summary dari 'summaryData'
      summary: {
        // === REVISED: Renamed field ===
        currentMonthlyIncome: summaryData.currentMonthlyIncome,
        totalBudgeted: summaryData.totalBudgeted, 
        activeSakus: summaryData.activeSakus,
        unreadNotifications: summaryData.unreadNotifications,
      },
      // Ambil data pie/bar chart dari 'summaryData'
      monthlyCategories: summaryData.categories,
     
      // Ambil data line chart dari 'trendData'
      categoryTrend: trendData 
    }

    // 4. Kirim 'responseData' yang sudah digabung
    res.json({ success: true, data: responseData }) 
   

  } catch (err) {
    console.error("❌ Error in getUserDashboard:", err)
    res
      .status(500)
      .json({ success: false, message: "Gagal memuat dashboard", error: err.message })
  }
}
