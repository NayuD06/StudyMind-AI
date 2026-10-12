import { Router } from 'express'
import { prisma } from '../../lib/prisma.js'

export const subjectsRouter = Router()

subjectsRouter.get('/', async (_req, res) => {
  res.json({ items: await prisma.subject.findMany({ orderBy: { name: 'asc' } }) })
})
