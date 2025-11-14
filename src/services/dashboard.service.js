import { prisma } from '../config/prisma.js'

export class DashboardService {

  async getDashboardData(userId) {

    const unreadNotifications = await prisma.notification.count({
      where: { userId, readAt: null },
    })

    const activeSakus = await prisma.saku.count({ where: { userId } });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let saku = await prisma.saku.findFirst({
      where: { userId, month, year },
      include: {
        allocations: { include: { category: true } },
      },
    })

    if (!saku) {
      return {
        totalBalance: 0,
        totalTransactions: 0, 
        activeSakus,
        unreadNotifications,
        categories: [],
      }
    }

    if (!saku.allocations || saku.allocations.length === 0) {
      const defaults = [
        { name: "Makan", percentage: 50 },
        { name: "Transportasi", percentage: 30 },
        { name: "Tabungan", percentage: 20 },
      ]

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
        })

        await prisma.sakuAllocation.create({
          data: {
            sakuId: saku.id,
            categoryId: category.id,
            percentage: d.percentage,
            amount: (sakuSalary * d.percentage) / 100,
          },
        })
      }

      saku = await prisma.saku.findFirst({
        where: { id: saku.id },
        include: {
          allocations: { include: { category: true } },
        },
      })
    }

    const totalBalance = Number(saku.salary) || 0
    const totalTransactions = saku.allocations.length
    const totalAllocation = saku.allocations.reduce((sum, a) => sum + Number(a.amount), 0)

    const categories = saku.allocations.map((a) => ({
      category: a.category?.name || "Tidak diketahui",
      amount: Number(a.amount),
      percentage: totalAllocation === 0 ? "0.00" : ((Number(a.amount) / totalAllocation) * 100).toFixed(2),
    }))

    return {
      totalBalance,
      totalTransactions,
      activeSakus,
      unreadNotifications,
      categories,
    }
  } 

  // Mengambil data tren PER KATEGORI untuk line chart (3 bulan terakhir)
  async getTrendDataPerCategory(userId) {

    // 1. Siapkan daftar 3 bulan terakhir (termasuk bulan ini)
    const dates = [];
    const now = new Date();
    for (let i = 2; i >= 0; i--) { // 2, 1, 0 = 3 bulan
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      dates.push({
        month: d.getMonth() + 1, // 1-based month (Jan = 1)
        year: d.getFullYear(),
        monthName: d.toLocaleString('id-ID', { month: 'short' }), // "Okt", "Nov", "Des"
      })
    }
    const monthLabels = dates.map(d => d.monthName); // Hasil: ["Sep", "Okt", "Nov"]

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
    // 3a. Kumpulkan dulu semua kategori unik dari 3 bulan ini
    const categoriesMap = new Map();
    for (const saku of sakus) {
      for (const alloc of saku.allocations) {
        if (alloc.category) {
          // Simpan Kategori berdasarkan ID agar unik
          categoriesMap.set(alloc.category.id, alloc.category.name);
        }
      }
    }

    // 3b. Buat struktur data final untuk chart
    const categoryData = [];

    // Untuk setiap kategori unik (Makan, Transportasi, ...)
    for (const [categoryId, categoryName] of categoriesMap.entries()) {
      
      const dataPoints = []; 
      
      // Cek datanya untuk setiap bulan (Sep, Okt, Nov)
      for (const date of dates) {
        // Cari Saku yang cocok untuk bulan & tahun ini
        const saku = sakus.find(s => s.month === date.month && s.year === date.year);
        
        let amount = 0; // Default 0 jika tidak ada data
        if (saku) {
          // Cari alokasi untuk kategori ini di dalam Saku bulan ini
          const allocation = saku.allocations.find(a => a.categoryId === categoryId);
          if (allocation) {
            amount = Number(allocation.amount);
          }
        }
        dataPoints.push(amount);
      } // Selesai loop 3 bulan

      // Masukkan hasilnya
      categoryData.push({
        name: categoryName,
        data: dataPoints, // Hasil: [750000, 700000, 800000]
      })
    }

    // 4. Kembalikan data 
    return {
      months: monthLabels,   // Hasil: ["Sep", "Okt", "Nov"]
      categories: categoryData, // Hasil: [ { name: "Makan", data: [...] }, { name: "Transportasi", data: [...] } ]
    }
  }

}