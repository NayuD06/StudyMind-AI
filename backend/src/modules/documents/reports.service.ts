import type { z } from 'zod'
import { logAdminAction } from '../../lib/audit.js'
import { HttpError } from '../../lib/httpError.js'
import { notify } from '../../lib/notify.js'
import { prisma } from '../../lib/prisma.js'
import type { AuthUser } from '../../middlewares/auth.js'
import type { reportSchema, resolveReportSchema } from './documents.schema.js'
import { findPublic, moderateDocument } from './documents.service.js'

export async function createReport(documentId: number, input: z.infer<typeof reportSchema>, user: AuthUser) {
  const document = await findPublic(documentId)
  if (document.uploaderId === user.id) throw new HttpError(400, 'Không thể báo cáo tài liệu của chính mình')

  const open = await prisma.report.findFirst({ where: { documentId, userId: user.id, status: 'OPEN' } })
  if (open) throw new HttpError(409, 'Bạn đã báo cáo tài liệu này, quản trị viên đang xem xét')

  await prisma.report.create({ data: { documentId, userId: user.id, reason: input.reason } })
}

// ----- Dành cho quản trị viên -----

export function listReports(status: 'OPEN' | 'RESOLVED' | 'REJECTED') {
  return prisma.report.findMany({
    where: { status },
    select: {
      id: true,
      reason: true,
      status: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      document: { select: { id: true, title: true, moderationStatus: true, uploader: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: status === 'OPEN' ? 'asc' : 'desc' },
    take: 100,
  })
}

// REMOVE: gỡ tài liệu khỏi thư viện và đóng mọi báo cáo đang mở về nó. DISMISS: bỏ qua riêng báo cáo này.
export async function resolveReport(id: number, input: z.infer<typeof resolveReportSchema>, admin: AuthUser) {
  const report = await prisma.report.findUnique({ where: { id }, include: { document: { select: { title: true } } } })
  if (!report) throw new HttpError(404, 'Không tìm thấy báo cáo')
  if (report.status !== 'OPEN') throw new HttpError(409, 'Báo cáo này đã được xử lý')
  const { title } = report.document

  if (input.action === 'DISMISS') {
    await prisma.report.update({ where: { id }, data: { status: 'REJECTED' } })
    await logAdminAction(admin.id, 'REPORT_DISMISS', title)
    await notify(report.userId, `Báo cáo của bạn về tài liệu "${title}" đã được xem xét: tài liệu không vi phạm.`, report.documentId)
    return
  }

  await moderateDocument(report.documentId, { status: 'REJECTED', reason: input.reason }, admin)
  const where = { documentId: report.documentId, status: 'OPEN' } as const
  const open = await prisma.report.findMany({ where, select: { userId: true } })
  await prisma.report.updateMany({ where, data: { status: 'RESOLVED' } })
  await logAdminAction(admin.id, 'REPORT_RESOLVE', `${title} · gỡ sau ${open.length} báo cáo`)
  for (const userId of new Set(open.map((item) => item.userId))) {
    await notify(userId, `Cảm ơn bạn đã báo cáo: tài liệu "${title}" đã bị gỡ khỏi thư viện.`)
  }
}
