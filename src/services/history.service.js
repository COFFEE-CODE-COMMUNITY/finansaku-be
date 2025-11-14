import { prisma } from '../config/prisma.js'

export class HistoryService {
  /**
   * Fetches all Saku records (monthly budgets) for a specific user.
   */
  async getUserHistory(userId) {
    const sakus = await prisma.saku.findMany({
      where: { userId: userId },
      include: {
        city: true, // Include the city details
        allocations: {
          include: {
            category: true, // Include the category name for each allocation
          },
        },
        details: {
          where: { key: 'dependents' }, // Only get the dependents detail
        },
      },
      orderBy: [
        { year: 'desc' }, // Show newest first
        { month: 'desc' },
      ],
    })

    // Format the data cleanly for the API response
    const formattedHistory = sakus.map((saku) => {
      const dependents = saku.details.find((d) => d.key === 'dependents')?.valueNumber ?? null

      return {
        id: saku.id,
        year: saku.year,
        month: saku.month,
        salary: saku.salary,
        notes: saku.notes,
        city: saku.city ? saku.city.name : null,
        dependents: dependents,
        allocations: saku.allocations.map((a) => ({
          category: a.category ? a.category.name : 'Unknown',
          amount: a.amount,
          percentage: a.percentage,
        })),
      }
    })

    return {
      data: formattedHistory,
      meta: {
        total: formattedHistory.length,
      },
    }
  }
}