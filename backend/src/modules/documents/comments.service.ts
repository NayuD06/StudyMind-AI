import type { z } from 'zod'
import { logAdminAction } from '../../lib/audit.js'
import { HttpError } from '../../lib/httpError.js'
import { notify } from '../../lib/notify.js'
import { prisma } from '../../lib/prisma.js'
import type { AuthUser } from '../../middlewares/auth.js'
import type { commentSchema } from './documents.schema.js'
import { findPublic, findViewable } from './documents.service.js'

const select = { id: true, content: true, createdAt: true, user: { select: { id: true, name: true } } } as const

export async function listComments(documentId: number, user?: AuthUser) {
  await findViewable(documentId, user)
  const [items, total] = await Promise.all([
    prisma.comment.findMany({ where: { documentId }, select, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.comment.count({ where: { documentId } }),
  ])
  return { items, total }
}

export async function addComment(documentId: number, input: z.infer<typeof commentSchema>, user: AuthUser) {
  const document = await findPublic(documentId)
  const comment = await prisma.comment.create({ data: { content: input.content, documentId, userId: user.id }, select })
  if (document.uploaderId !== user.id) {
    await notify(document.uploaderId, `${comment.user.name} đã bình luận về tài liệu "${document.title}"`, documentId)
  }
  return comment
}

// Người viết tự xóa bình luận của mình; quản trị viên xóa được mọi bình luận (có ghi nhật ký)
export async function deleteComment(documentId: number, commentId: number, user: AuthUser) {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, documentId },
    include: { user: { select: { email: true } }, document: { select: { title: true } } },
  })
  if (!comment) throw new HttpError(404, 'Không tìm thấy bình luận')
  if (comment.userId !== user.id && user.role !== 'ADMIN') throw new HttpError(403, 'Không có quyền')

  await prisma.comment.delete({ where: { id: commentId } })
  if (comment.userId !== user.id) {
    await logAdminAction(user.id, 'COMMENT_DELETE', `${comment.user.email} · ${comment.document.title} · "${comment.content.slice(0, 200)}"`)
  }
}
