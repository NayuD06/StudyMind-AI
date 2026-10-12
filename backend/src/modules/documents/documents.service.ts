import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Document, Prisma } from '@prisma/client'
import type { z } from 'zod'
import { env } from '../../config/env.js'
import { logAdminAction } from '../../lib/audit.js'
import { notify } from '../../lib/notify.js'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import type { AuthUser } from '../../middlewares/auth.js'
import type { createDocumentSchema, listDocumentsSchema, moderateSchema, ratingSchema } from './documents.schema.js'
import { inspectPdf } from './pdf.js'

const UPLOAD_ROOT = path.resolve(env.UPLOAD_DIR)

// storageKey do server sinh (UUID) nên không thể chứa "../"; basename là lớp chặn thứ hai
export const filePath = (storageKey: string) => path.join(UPLOAD_ROOT, path.basename(storageKey))

const summary = {
  id: true,
  title: true,
  description: true,
  school: true,
  major: true,
  pageCount: true,
  fileSize: true,
  viewCount: true,
  downloadCount: true,
  moderationStatus: true,
  rejectReason: true,
  createdAt: true,
  uploader: { select: { id: true, name: true } },
  subjects: { select: { subject: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.DocumentSelect

const isPublic = (doc: Pick<Document, 'moderationStatus' | 'isHidden'>) =>
  doc.moderationStatus === 'APPROVED' && !doc.isHidden

// Tài liệu chưa duyệt hoặc đang bị ẩn chỉ người đăng và quản trị viên xem được.
// Trả 404 thay vì 403 để người ngoài không biết tài liệu có tồn tại.
function assertCanView(doc: Pick<Document, 'moderationStatus' | 'isHidden' | 'uploaderId'>, user?: AuthUser) {
  if (isPublic(doc) || user?.role === 'ADMIN' || user?.id === doc.uploaderId) return
  throw new HttpError(404, 'Không tìm thấy tài liệu')
}

// Gắn điểm đánh giá trung bình cho cả danh sách bằng một truy vấn
async function withRatings<T extends { id: number }>(items: T[]) {
  const groups = await prisma.rating.groupBy({
    by: ['documentId'],
    where: { documentId: { in: items.map((item) => item.id) } },
    _avg: { score: true },
    _count: true,
  })
  const byId = new Map(
    groups.map((group) => [group.documentId, { avg: Math.round((group._avg.score ?? 0) * 10) / 10, count: group._count }]),
  )
  return items.map((item) => ({ ...item, rating: byId.get(item.id) ?? { avg: 0, count: 0 } }))
}

export async function findViewable(id: number, user?: AuthUser) {
  const document = await prisma.document.findUnique({ where: { id } })
  if (!document) throw new HttpError(404, 'Không tìm thấy tài liệu')
  assertCanView(document, user)
  return document
}

export async function findPublic(id: number) {
  const document = await prisma.document.findUnique({ where: { id } })
  if (!document || !isPublic(document)) throw new HttpError(404, 'Không tìm thấy tài liệu')
  return document
}

export async function createDocument(
  input: z.infer<typeof createDocumentSchema>,
  file: Express.Multer.File | undefined,
  user: AuthUser,
) {
  if (!file) throw new HttpError(400, 'Chưa chọn file PDF')
  const { pageCount, piiFindings } = await inspectPdf(file.buffer)

  if (input.subjectId && !(await prisma.subject.findUnique({ where: { id: input.subjectId } }))) {
    throw new HttpError(400, 'Môn học không tồn tại')
  }

  const storageKey = `${randomUUID()}.pdf`
  await mkdir(UPLOAD_ROOT, { recursive: true })
  await writeFile(filePath(storageKey), file.buffer)

  try {
    const document = await prisma.document.create({
      data: {
        title: input.title,
        description: input.description,
        school: input.school,
        major: input.major,
        storageKey,
        // Tên gốc chỉ để hiển thị; bỏ phần đường dẫn và ký tự điều khiển
        fileName: path.basename(file.originalname).replace(/[\x00-\x1f]/g, '').slice(0, 200),
        fileSize: file.size,
        pageCount,
        piiFindings: piiFindings.length ? piiFindings : undefined,
        uploaderId: user.id,
        subjects: input.subjectId ? { create: { subjectId: input.subjectId } } : undefined,
      },
      select: summary,
    })
    return { document, piiFindings }
  } catch (err) {
    await unlink(filePath(storageKey)).catch(() => {})
    throw err
  }
}

const MAX_SEARCH_WORDS = 8

// Tách từ khóa thành từng từ, tài liệu phải chứa đủ mọi từ (ở tiêu đề, mô tả hoặc tên môn, thứ tự bất kỳ).
// Nhờ vậy "sql cơ bản" tìm ra "Cơ bản về SQL", điều mà so khớp nguyên cụm không làm được.
function searchFilter(q: string): Prisma.DocumentWhereInput[] {
  return q
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_SEARCH_WORDS)
    // Prisma không tự thoát ký tự đại diện của LIKE, nên gõ "%" sẽ khớp mọi tài liệu
    .map((word) => word.replace(/[\\%_]/g, '\\$&'))
    .map((word) => ({
      OR: [
        { title: { contains: word } },
        { description: { contains: word } },
        { subjects: { some: { subject: { name: { contains: word } } } } },
      ],
    }))
}

// Điểm trung bình không phải một cột nên phải tính trước rồi lọc theo danh sách id
async function idsRatedAtLeast(minRating: number) {
  const groups = await prisma.rating.groupBy({ by: ['documentId'], having: { score: { _avg: { gte: minRating } } } })
  return groups.map((group) => group.documentId)
}

export async function listPublicDocuments(query: z.infer<typeof listDocumentsSchema>) {
  const where: Prisma.DocumentWhereInput = {
    moderationStatus: 'APPROVED',
    isHidden: false,
    ...(query.q && { AND: searchFilter(query.q) }),
    ...(query.subjectId && { subjects: { some: { subjectId: query.subjectId } } }),
    ...(query.uploaderId && { uploaderId: query.uploaderId }),
    ...(query.school && { school: query.school }),
    ...(query.major && { major: query.major }),
    ...(query.minRating && { id: { in: await idsRatedAtLeast(query.minRating) } }),
  }
  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      select: summary,
      orderBy: query.sort === 'popular' ? [{ downloadCount: 'desc' }, { createdAt: 'desc' }] : { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.document.count({ where }),
  ])
  return { items: await withRatings(items), total, page: query.page, limit: query.limit }
}

// Các trường và ngành đang có trong thư viện, để giao diện dựng ô lọc
export async function listFacets() {
  const shown = { moderationStatus: 'APPROVED', isHidden: false } as const
  const [schools, majors] = await Promise.all([
    prisma.document.findMany({ where: { ...shown, school: { not: null } }, select: { school: true }, distinct: ['school'], orderBy: { school: 'asc' }, take: 100 }),
    prisma.document.findMany({ where: { ...shown, major: { not: null } }, select: { major: true }, distinct: ['major'], orderBy: { major: 'asc' }, take: 100 }),
  ])
  return { schools: schools.map((row) => row.school!), majors: majors.map((row) => row.major!) }
}

export async function listMyDocuments(user: AuthUser) {
  const items = await prisma.document.findMany({ where: { uploaderId: user.id }, select: summary, orderBy: { createdAt: 'desc' } })
  return withRatings(items)
}

// Tài liệu đã lưu; cái nào bị gỡ khỏi thư viện sau đó thì không hiện nữa
export async function listFavorites(user: AuthUser) {
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id, document: { moderationStatus: 'APPROVED', isHidden: false } },
    select: { document: { select: summary } },
    orderBy: { createdAt: 'desc' },
  })
  return withRatings(favorites.map((favorite) => favorite.document))
}

export async function getDocument(id: number, user?: AuthUser) {
  const found = await prisma.document.findUnique({ where: { id }, select: { ...summary, isHidden: true, uploaderId: true } })
  if (!found) throw new HttpError(404, 'Không tìm thấy tài liệu')
  assertCanView(found, user)

  // Người đăng tự mở tài liệu của mình thì không tính lượt xem
  if (isPublic(found) && user?.id !== found.uploaderId) {
    await prisma.document.update({ where: { id }, data: { viewCount: { increment: 1 } } })
    found.viewCount += 1
  }

  const key = user && { userId_documentId: { userId: user.id, documentId: id } }
  const [[document], myRating, favorite] = await Promise.all([
    withRatings([found]),
    key ? prisma.rating.findUnique({ where: key }) : null,
    key ? prisma.favorite.findUnique({ where: key }) : null,
  ])
  const { isHidden: _isHidden, uploaderId: _uploaderId, ...rest } = document!
  return { ...rest, myRating: myRating?.score ?? null, isFavorite: !!favorite }
}

// Chỉ người đăng sửa được thông tin (không đổi được file PDF).
// Tài liệu bị từ chối mà được sửa thì quay lại hàng chờ duyệt; tài liệu đã duyệt vẫn giữ nguyên trạng thái.
export async function updateDocument(id: number, input: z.infer<typeof createDocumentSchema>, user: AuthUser) {
  const document = await prisma.document.findUnique({ where: { id } })
  if (!document) throw new HttpError(404, 'Không tìm thấy tài liệu')
  if (document.uploaderId !== user.id) throw new HttpError(403, 'Không có quyền')
  if (input.subjectId && !(await prisma.subject.findUnique({ where: { id: input.subjectId } }))) {
    throw new HttpError(400, 'Môn học không tồn tại')
  }

  const resubmit = document.moderationStatus === 'REJECTED'
  return prisma.document.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description ?? null,
      school: input.school ?? null,
      major: input.major ?? null,
      subjects: { deleteMany: {}, create: input.subjectId ? { subjectId: input.subjectId } : undefined },
      ...(resubmit && { moderationStatus: 'PENDING', rejectReason: null, reviewedAt: null, reviewedById: null }),
    },
    select: summary,
  })
}

export async function rateDocument(id: number, input: z.infer<typeof ratingSchema>, user: AuthUser) {
  const document = await findPublic(id)
  if (document.uploaderId === user.id) throw new HttpError(400, 'Không thể tự đánh giá tài liệu của mình')

  const key = { userId_documentId: { userId: user.id, documentId: id } }
  await prisma.rating.upsert({ where: key, create: { userId: user.id, documentId: id, score: input.score }, update: { score: input.score } })
  const [rated] = await withRatings([{ id }])
  return { rating: rated!.rating, myRating: input.score }
}

export async function setFavorite(id: number, user: AuthUser, saved: boolean) {
  const key = { userId_documentId: { userId: user.id, documentId: id } }
  if (saved) {
    await findPublic(id)
    await prisma.favorite.upsert({ where: key, create: { userId: user.id, documentId: id }, update: {} })
  } else {
    await prisma.favorite.deleteMany({ where: { userId: user.id, documentId: id } })
  }
  return { isFavorite: saved }
}

// Trả về thông tin file sau khi đã kiểm tra quyền xem; ghi lịch sử nếu là lượt tải xuống
export async function getDocumentFile(id: number, user: AuthUser | undefined, download: boolean) {
  const document = await prisma.document.findUnique({ where: { id } })
  if (!document) throw new HttpError(404, 'Không tìm thấy tài liệu')
  assertCanView(document, user)

  if (download) {
    if (!user) throw new HttpError(401, 'Cần đăng nhập để tải xuống')
    await prisma.$transaction([
      prisma.download.create({ data: { userId: user.id, documentId: id } }),
      prisma.document.update({ where: { id }, data: { downloadCount: { increment: 1 } } }),
    ])
  }
  return { path: filePath(document.storageKey), fileName: document.fileName }
}

export async function deleteDocument(id: number, user: AuthUser) {
  const document = await prisma.document.findUnique({ where: { id } })
  if (!document) throw new HttpError(404, 'Không tìm thấy tài liệu')
  if (user.role !== 'ADMIN' && document.uploaderId !== user.id) throw new HttpError(403, 'Không có quyền')

  await prisma.document.delete({ where: { id } })
  await unlink(filePath(document.storageKey)).catch(() => {})
  if (document.uploaderId !== user.id) {
    await logAdminAction(user.id, 'DOCUMENT_DELETE', document.title)
    await notify(document.uploaderId, `Tài liệu "${document.title}" của bạn đã bị quản trị viên xóa.`)
  }
}

// ----- Dành cho quản trị viên -----

export function listForModeration(status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  return prisma.document.findMany({
    where: { moderationStatus: status },
    select: { ...summary, fileName: true, piiFindings: true, reviewedAt: true },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
}

export async function moderateDocument(id: number, input: z.infer<typeof moderateSchema>, admin: AuthUser) {
  const exists = await prisma.document.findUnique({ where: { id }, select: { id: true } })
  if (!exists) throw new HttpError(404, 'Không tìm thấy tài liệu')

  const document = await prisma.document.update({
    where: { id },
    data: {
      moderationStatus: input.status,
      rejectReason: input.status === 'REJECTED' ? input.reason : null,
      reviewedAt: new Date(),
      reviewedById: admin.id,
    },
    select: summary,
  })
  const approved = input.status === 'APPROVED'
  await notify(
    document.uploader.id,
    approved
      ? `Tài liệu "${document.title}" đã được duyệt và hiện trong thư viện.`
      : `Tài liệu "${document.title}" bị từ chối. Lý do: ${input.reason}`,
    id,
  )
  await logAdminAction(
    admin.id,
    approved ? 'DOCUMENT_APPROVE' : 'DOCUMENT_REJECT',
    approved ? document.title : `${document.title} · lý do: ${input.reason}`,
  )
  return document
}
