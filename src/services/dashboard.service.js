import { prisma } from '../config/prisma.js'

export class DashboardService {
  async getUserDashboard(userId) {
    // Ambil data saku dan alokasinya
    const [sakus, allocations, unreadNotifications] = await Promise.all([
      prisma.saku.findMany({
        where: { userId },
        include: {
          allocations: true,
        },
      }),
      prisma.sakuAllocation.findMany({
        where: { saku: { userId } },
      }),
      prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ])

    // Hitung total saldo (dari salary atau total amount allocations)
    const totalBalance = sakus.reduce(
      (sum, s) => sum + Number(s.salary ?? 0),
      0
    )

    // Total transaksi → diambil dari total allocations
    const totalTransactions = allocations.length

    // Total saku aktif (jumlah saku user)
    const activeSakus = sakus.length

    // Total notifikasi belum dibaca
    const unread = unreadNotifications

    return {
      totalBalance,
      totalTransactions,
      activeSakus,
      unreadNotifications: unread,
    }
  }
}
