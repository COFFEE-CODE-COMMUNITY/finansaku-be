import { prisma } from '../config/prisma.js'

export class DashboardService {

  async getDashboardData(userId) {

    const unreadNotifications = await prisma.notification.count({
      where: { userId, readAt: null },
    })

    const activeSakus = await prisma.saku.count({ where: { userId } })

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    let saku = await prisma.saku.findFirst({
      where: { userId, month, year },
      include: {
        allocations: { include: { category: true } },
      },
    })

    if (!saku) {
      return {
        currentMonthlyIncome: 0,
        totalBudgeted: 0,
        activeSakus,
        unreadNotifications,
        categories: [],
      }
    }

    const currentMonthlyIncome = Number(saku.salary) || 0

    const totalBudgeted = saku.allocations.reduce((sum, a) => sum + Number(a.amount), 0)

    const sortedAllocations = saku.allocations
      .map((a) => ({
        name: a.category?.name || "Tidak diketahui",
        amount: Number(a.amount),
      }))
      .sort((a, b) => b.amount - a.amount); // Sort descending by amount

    const top3 = sortedAllocations.slice(0, 3);
    const others = sortedAllocations.slice(3);

    const otherAmount = others.reduce((sum, cat) => sum + cat.amount, 0);

    const categories = top3.map((a) => ({
      category: a.name,
      amount: a.amount,
      percentage: totalBudgeted === 0 ? "0.00" : ((a.amount / totalBudgeted) * 100).toFixed(2),
    }));

    // Add the "Dan Lainnya" category if it has any value
    if (otherAmount > 0 && totalBudgeted > 0) {
      categories.push({
        category: "Dan Lainnya",
        amount: otherAmount,
        percentage: ((otherAmount / totalBudgeted) * 100).toFixed(2),
      });
    }

    return {
      currentMonthlyIncome,
      totalBudgeted,
      activeSakus,
      unreadNotifications,
      categories, // This is now the grouped array
    }
  }

async getTrendDataPerCategory(userId) {

    // 1. Siapkan daftar 3 bulan terakhir (termasuk bulan ini)
    const dates = []
    const now = new Date()
    for (let i = 2; i >= 0; i--) { // 2, 1, 0 = 3 bulan
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      dates.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        monthName: d.toLocaleString('id-ID', { month: 'long' }),
      });
    }
    const monthLabels = dates.map(d => d.monthName)

    // 2. Query semua Saku & Alokasinya & Kategorinya dalam 3 bulan terakhir
    const sakus = await prisma.saku.findMany({
      where: {
        userId: userId,
        OR: dates.map(date => ({
          month: date.month,
          year: date.year,
        })),
      },
      include: {
        allocations: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' }
      ]
    })

    // 3. Proses data
    const categoriesMap = new Map(); // Will store all unique category names (e.g., "Makan", "Dan Lainnya")
    const monthlyAggregatedData = new Map(); // Key: "YYYY-MM", Value: Map("CategoryName" -> amount)

    for (const saku of sakus) {
      const monthKey = `${saku.year}-${saku.month}`;
      const monthlyCategories = new Map(); // Stores the final amounts for THIS month

      const sortedAllocations = saku.allocations
        .map(a => ({
          name: a.category?.name || "Tidak diketahui",
          amount: Number(a.amount),
        }))
        .sort((a, b) => b.amount - a.amount); // Sort descending

      const top3 = sortedAllocations.slice(0, 3);
      const others = sortedAllocations.slice(3);
      const otherAmount = others.reduce((sum, cat) => sum + cat.amount, 0);

      // Add Top 3 to this month's data and the global map
      for (const cat of top3) {
        monthlyCategories.set(cat.name, cat.amount);
        categoriesMap.set(cat.name, cat.name); // Add to global list
      }

      // Add Misc to this month's data and the global map
      if (otherAmount > 0) {
        monthlyCategories.set("Dan Lainnya", otherAmount);
        categoriesMap.set("Dan Lainnya", "Dan Lainnya"); // Add to global list
      }

      monthlyAggregatedData.set(monthKey, monthlyCategories);
    }

    // 3b. Buat struktur data final untuk chart
    const categoryData = []

    // Use the new aggregated map of Top 3 + Misc names
    for (const categoryName of categoriesMap.keys()) {
      const dataPoints = []
      for (const date of dates) {
        const monthKey = `${date.year}-${date.month}`;
        const sakuData = monthlyAggregatedData.get(monthKey);

        let amount = 0;
        // Check if this month had data for this specific category
        if (sakuData && sakuData.has(categoryName)) {
          amount = sakuData.get(categoryName);
        }
        dataPoints.push(amount);
      }
      categoryData.push({
        name: categoryName,
        data: dataPoints,
      })
    }

    // 3c. Cari indeks bulan pertama yang ada datanya
    let firstDataIndex = 0 // Default: mulai dari indeks 0

    if (categoryData.length > 0) {
      // Kita cek 2 bulan pertama (indeks 0 dan 1)
      for (let i = 0; i < monthLabels.length - 1; i++) {
        // Cek apakah SEMUA kategori punya data 0 di bulan ini
        const allCategoriesAreZero = categoryData.every(category => {
          return category.data[i] === 0
        })

        if (allCategoriesAreZero) {
          // Jika semua 0, lewati bulan ini. Pindahkan indeks awal
          firstDataIndex = i + 1
        } else {
          // Jika ada 1 saja datamulai dari sini
          break
        }
      }
    }

    // 3d. Pangkas (slice) array berdasarkan indeks
    const finalMonths = monthLabels.slice(firstDataIndex)
    const finalCategories = categoryData.map(category => ({
      name: category.name,
      data: category.data.slice(firstDataIndex)
    }))

    // 4. Kembalikan data yang sudah dipangkas
    return {
      months: finalMonths,
      categories: finalCategories,
    }
  }

}