import { NotificationsRepository } from '../modules/notifications.repository.js'

export class NotificationsService {
  constructor(repo = new NotificationsRepository()) {
    this.repo = repo
  }

  getUserNotifications(userId) {
    return this.repo.findByUserId(userId)
  }

  readNotification(id) {
    return this.repo.markAsRead(id)
  }

  broadcast(userIds, title, body, type) {
    return this.repo.createMany(userIds, { title, body, type })
  }
}
