import { Router } from 'express'
import { prisma } from '../../lib/prisma.js'
import { requireAuth } from '../../middlewares/auth.js'

const LIMIT = 30

export const notificationsRouter = Router()

notificationsRouter.use(requireAuth)

notificationsRouter.get('/', async (req, res) => {
  const userId = req.user!.id
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      select: { id: true, message: true, documentId: true, readAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ])
  res.json({ items, unread })
})

notificationsRouter.post('/read', async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.id, readAt: null }, data: { readAt: new Date() } })
  res.status(204).end()
})
