import { Router } from 'express'
import { adminRouter } from '../modules/admin/admin.routes.js'
import { authRouter } from '../modules/auth/auth.routes.js'
import { documentsRouter } from '../modules/documents/documents.routes.js'
import { notificationsRouter } from '../modules/notifications/notifications.routes.js'
import { subjectsRouter } from '../modules/subjects/subjects.routes.js'
import { usersRouter } from '../modules/users/users.routes.js'

export const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

router.use('/auth', authRouter)
router.use('/subjects', subjectsRouter)
router.use('/documents', documentsRouter)
router.use('/users', usersRouter)
router.use('/notifications', notificationsRouter)
router.use('/admin', adminRouter)

// Khi làm tới phần AI:
// router.use('/ai', requireAuth, aiLimiter, aiRouter)
