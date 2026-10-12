import { Router } from 'express'
import { adminRouter } from '../modules/admin/admin.routes.js'
import { authRouter } from '../modules/auth/auth.routes.js'
import { documentsRouter } from '../modules/documents/documents.routes.js'
import { subjectsRouter } from '../modules/subjects/subjects.routes.js'

export const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

router.use('/auth', authRouter)
router.use('/subjects', subjectsRouter)
router.use('/documents', documentsRouter)
router.use('/admin', adminRouter)

// Khi làm tới phần AI:
// router.use('/ai', requireAuth, aiLimiter, aiRouter)
