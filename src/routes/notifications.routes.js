import express from 'express'
import { NotificationsService } from '../services/notifications.service.js'
import { BroadcastNotificationDto } from '../modules/broadcast-notification.dto.js'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = express.Router()
const service = new NotificationsService()

// === GET /api/v1/notifications/me ===
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const notifications = await service.getUserNotifications(req.user.id)
    res.json({ ok: true, data: notifications })
  } catch (err) {
    next(err)
  }
})

// === PATCH /api/v1/notifications/:id/read ===
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await service.readNotification(req.params.id)
    res.json({ ok: true, data: notification })
  } catch (err) {
    next(err)
  }
})

// === POST /api/v1/notifications/broadcast ===
// untuk sementara pakai authenticate dulu,
// nanti bisa diganti adminMiddleware kalau backend A sudah siap
router.post('/broadcast', authenticate, async (req, res, next) => {
  try {
    const parsed = BroadcastNotificationDto.parse(req.body)
    const result = await service.broadcast(
      parsed.userIds,
      parsed.title,
      parsed.body,
      parsed.type
    )
    res.json({ ok: true, data: result })
  } catch (err) {
    next(err)
  }
})

export default router
