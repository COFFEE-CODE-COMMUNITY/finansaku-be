import { prisma } from '../config/prisma.js'

export class DashboardService {

  async getDashboardData(userId) {

    const unreadNotifications = await prisma.notification.count({
      where: { userId, readAt: null },
    });

    const activeSakus = await prisma.saku.count({ where: { userId } });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let saku = await prisma.saku.findFirst({
      where: { userId, month, year },
      include: {
        allocations: { include: { category: true } },
      },
    });

    if (!saku) {
      return {
        totalBalance: 0,
        totalTransactions: 0, 
        activeSakus,
        unreadNotifications,
        categories: [],
      };
    }

    if (!saku.allocations || saku.allocations.length === 0) {
      const defaults = [
        { name: "Makan", percentage: 50 },
        { name: "Transportasi", percentage: 30 },
        { name: "Tabungan", percentage: 20 },
      ];

      const sakuSalary = Number(saku.salary) || 0;

      for (const d of defaults) {
        const category = await prisma.budgetCategory.upsert({
          where: { userId_name: { userId: userId, name: d.name } },
          update: {},
          create: { 
            userId: userId, 
            name: d.name, 
            defaultPercentage: d.percentage 
          },
        });

        await prisma.sakuAllocation.create({
          data: {
            sakuId: saku.id,
            categoryId: category.id,
            percentage: d.percentage,
            amount: (sakuSalary * d.percentage) / 100,
          },
        });
      }

      saku = await prisma.saku.findFirst({
        where: { id: saku.id },
        include: {
          allocations: { include: { category: true } },
        },
      });
    }

    const totalBalance = Number(saku.salary) || 0;
    const totalTransactions = saku.allocations.length; 
    const totalAllocation = saku.allocations.reduce((sum, a) => sum + Number(a.amount), 0);

    const categories = saku.allocations.map((a) => ({
      category: a.category?.name || "Tidak diketahui",
      amount: Number(a.amount),
      percentage: totalAllocation === 0 ? "0.00" : ((Number(a.amount) / totalAllocation) * 100).toFixed(2),
    }));

    return {
      totalBalance,
      totalTransactions,
      activeSakus,
      unreadNotifications,
      categories,
    };
  }
}