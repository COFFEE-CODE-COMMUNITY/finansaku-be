import { prisma } from '../config/prisma.js'

export class HistoryService {
  async getUserHistory(userId, { type, limit, page }) {
    const skip = (page - 1) * limit
    const where = { userId }

    if (type !== 'all') where.type = type

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          category: true,
          amount: true,
          type: true,
          createdAt: true,
        },
      }),
      prisma.transaction.count({ where }),
    ])

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    }
  }
}
