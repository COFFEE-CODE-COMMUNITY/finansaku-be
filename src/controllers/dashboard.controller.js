import { DashboardService } from '../services/dashboard.service.js'

const service = new DashboardService()

export const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" })
    }

    // 1. Panggil kedua fungsi service secara paralel 
    const [
      summaryData,  // Hasil dari getDashboardData
      trendData     // Hasil dari getTrendDataPerCategory
    ] = await Promise.all([
      service.getDashboardData(userId),
      service.getTrendDataPerCategory(userId) // Panggil fungsi baru di sini
    ])

    // 2. Gabungkan hasilnya menjadi satu objek data
    const responseData = {
      // Ambil data summary dari 'summaryData'
      summary: {
        totalBalance: summaryData.totalBalance,
        totalTransactions: summaryData.totalTransactions,
        activeSakus: summaryData.activeSakus,
        unreadNotifications: summaryData.unreadNotifications,
      },
      // Ambil data pie/bar chart dari 'summaryData'
      monthlyCategories: summaryData.categories,
      
      // Ambil data line chart dari 'trendData'
      categoryTrend: trendData 
    }

    // 3. Kirim 'responseData' yang sudah digabung
    res.json({ success: true, data: responseData }) // Tetap pakai format { ok: true, data: ... }
    

  } catch (err) {
    console.error("❌ Error in getUserDashboard:", err)
    res
      .status(500)
      .json({ success: false, message: "Gagal memuat dashboard", error: err.message })
  }
}