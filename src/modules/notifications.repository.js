import { prisma } from '../config/prisma.js'

export class NotificationsRepository {
  async findByUserId(userId) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async markAsRead(id) {
    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    })
  }

  async createMany(userIds, { title, body, type }) {
    const data = userIds.map(userId => ({
      userId,
      title,
      body,
      type,
    }))
    return prisma.notification.createMany({ data })
  }
}
