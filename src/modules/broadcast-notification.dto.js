import { z } from 'zod'

export const BroadcastNotificationDto = z.object({
  userIds: z.array(z.string()).nonempty(),
  title: z.string().min(1),
  body: z.string().min(1),
  type: z.string().min(1),
})
