import { Router } from 'express'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import { idParamSchema } from '../documents/documents.schema.js'

export const usersRouter = Router()

const publicDocs = { moderationStatus: 'APPROVED', isHidden: false } as const

// Trang công khai của một người đăng: không trả email. Tài liệu của họ lấy qua /documents?uploaderId=
usersRouter.get('/:id', async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, school: true, major: true, createdAt: true },
  })
  if (!user) throw new HttpError(404, 'Không tìm thấy người dùng')

  const totals = await prisma.document.aggregate({
    where: { uploaderId: id, ...publicDocs },
    _count: true,
    _sum: { downloadCount: true },
  })
  res.json({ user: { ...user, documentCount: totals._count, downloadCount: totals._sum.downloadCount ?? 0 } })
})
