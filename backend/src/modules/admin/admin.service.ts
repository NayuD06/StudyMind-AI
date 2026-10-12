import { Prisma } from '@prisma/client'
import type { z } from 'zod'
import { logAdminAction } from '../../lib/audit.js'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import type { AuthUser } from '../../middlewares/auth.js'
import type { listLogsSchema, listUsersSchema, subjectSchema, updateUserSchema } from './admin.schema.js'

const DAY_MS = 24 * 60 * 60 * 1000
const USERS_PER_PAGE = 20
const LOGS_PER_PAGE = 30
const TOP_ROWS = 5

export async function getStats() {
  // Mốc 0 giờ của 7 ngày gần nhất, tính cả hôm nay
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - 6)

  const [users, lockedUsers, byStatus, subjects, downloads, openReports, recent, signups, topDocuments, byUploader] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isLocked: true } }),
    prisma.document.groupBy({ by: ['moderationStatus'], _count: true }),
    prisma.subject.count(),
    prisma.download.count(),
    prisma.report.count({ where: { status: 'OPEN' } }),
    prisma.document.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.document.findMany({
      where: { moderationStatus: 'APPROVED', isHidden: false },
      select: { id: true, title: true, downloadCount: true, viewCount: true },
      orderBy: [{ downloadCount: 'desc' }, { viewCount: 'desc' }],
      take: TOP_ROWS,
    }),
    prisma.document.groupBy({
      by: ['uploaderId'],
      where: { moderationStatus: 'APPROVED', isHidden: false },
      _count: true,
      _sum: { downloadCount: true },
      orderBy: [{ _count: { uploaderId: 'desc' } }, { _sum: { downloadCount: 'desc' } }],
      take: TOP_ROWS,
    }),
  ])

  const count = (status: string) => byStatus.find((row) => row.moderationStatus === status)?._count ?? 0
  // Đếm theo từng ngày trong 7 ngày gần nhất
  const perDay = (rows: { createdAt: Date }[]) => {
    const days = Array.from({ length: 7 }, (_, i) => ({ date: new Date(start.getTime() + i * DAY_MS), count: 0 }))
    for (const row of rows) {
      const day = days[Math.floor((row.createdAt.getTime() - start.getTime()) / DAY_MS)]
      if (day) day.count++
    }
    return days
  }

  const names = await prisma.user.findMany({
    where: { id: { in: byUploader.map((row) => row.uploaderId) } },
    select: { id: true, name: true, email: true },
  })
  const topUploaders = byUploader.map((row) => {
    const user = names.find((item) => item.id === row.uploaderId)
    return { id: row.uploaderId, name: user?.name ?? '', email: user?.email ?? '', documents: row._count, downloads: row._sum.downloadCount ?? 0 }
  })

  return {
    users,
    lockedUsers,
    subjects,
    downloads,
    openReports,
    documents: { pending: count('PENDING'), approved: count('APPROVED'), rejected: count('REJECTED') },
    uploads: perDay(recent),
    signups: perDay(signups),
    topDocuments,
    topUploaders,
  }
}

// ----- Người dùng -----

export async function listUsers(query: z.infer<typeof listUsersSchema>) {
  const where: Prisma.UserWhereInput = query.q
    ? { OR: [{ name: { contains: query.q } }, { email: { contains: query.q } }] }
    : {}
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isLocked: true,
        createdAt: true,
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * USERS_PER_PAGE,
      take: USERS_PER_PAGE,
    }),
    prisma.user.count({ where }),
  ])
  return { items, total, page: query.page, limit: USERS_PER_PAGE }
}

export async function updateUser(id: number, input: z.infer<typeof updateUserSchema>, admin: AuthUser) {
  // Không cho tự khóa hoặc tự hạ quyền, để hệ thống không rơi vào cảnh hết quản trị viên
  if (id === admin.id) throw new HttpError(400, 'Không thể tự đổi quyền hoặc khóa chính mình')
  if (!(await prisma.user.findUnique({ where: { id }, select: { id: true } }))) {
    throw new HttpError(404, 'Không tìm thấy người dùng')
  }

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { role: input.role, isLocked: input.isLocked },
      select: { id: true, name: true, email: true, role: true, isLocked: true },
    }),
    // Khóa hoặc đổi quyền thì hủy mọi phiên đang mở, buộc đăng nhập lại với quyền mới.
    // Xóa hẳn (như endAllSessions): token cũ còn ở thiết bị khác gửi lên sẽ không kéo theo hủy phiên mới.
    prisma.refreshToken.deleteMany({ where: { userId: id } }),
  ])
  if (input.isLocked !== undefined) await logAdminAction(admin.id, input.isLocked ? 'USER_LOCK' : 'USER_UNLOCK', user.email)
  if (input.role !== undefined) {
    await logAdminAction(admin.id, 'USER_ROLE', `${user.email} → ${input.role === 'ADMIN' ? 'quản trị' : 'sinh viên'}`)
  }
  return user
}

// ----- Môn học -----

// "Cơ sở dữ liệu" -> "co-so-du-lieu"
const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const isDuplicate = (err: unknown) => err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'

function subjectData(input: z.infer<typeof subjectSchema>) {
  const slug = slugify(input.name)
  if (!slug) throw new HttpError(400, 'Tên môn không hợp lệ')
  return { name: input.name, slug }
}

export function listSubjects() {
  return prisma.subject.findMany({
    select: { id: true, name: true, slug: true, _count: { select: { documents: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function createSubject(input: z.infer<typeof subjectSchema>, admin: AuthUser) {
  try {
    const subject = await prisma.subject.create({ data: subjectData(input) })
    await logAdminAction(admin.id, 'SUBJECT_CREATE', subject.name)
    return subject
  } catch (err) {
    if (isDuplicate(err)) throw new HttpError(409, 'Môn học này đã có')
    throw err
  }
}

export async function updateSubject(id: number, input: z.infer<typeof subjectSchema>, admin: AuthUser) {
  const before = await prisma.subject.findUnique({ where: { id } })
  if (!before) throw new HttpError(404, 'Không tìm thấy môn học')
  try {
    const subject = await prisma.subject.update({ where: { id }, data: subjectData(input) })
    await logAdminAction(admin.id, 'SUBJECT_UPDATE', `${before.name} → ${subject.name}`)
    return subject
  } catch (err) {
    if (isDuplicate(err)) throw new HttpError(409, 'Môn học này đã có')
    throw err
  }
}

// Tài liệu thuộc môn bị xóa vẫn còn, chỉ mất nhãn môn học
export async function deleteSubject(id: number, admin: AuthUser) {
  const subject = await prisma.subject.findUnique({ where: { id } })
  if (!subject) throw new HttpError(404, 'Không tìm thấy môn học')
  await prisma.subject.delete({ where: { id } })
  await logAdminAction(admin.id, 'SUBJECT_DELETE', subject.name)
}

// ----- Nhật ký -----

export async function listLogs(query: z.infer<typeof listLogsSchema>) {
  const [items, total] = await Promise.all([
    prisma.adminLog.findMany({
      select: { id: true, action: true, summary: true, ip: true, createdAt: true, admin: { select: { name: true, email: true } } },
      orderBy: { id: 'desc' },
      skip: (query.page - 1) * LOGS_PER_PAGE,
      take: LOGS_PER_PAGE,
    }),
    prisma.adminLog.count(),
  ])
  return { items, total, page: query.page, limit: LOGS_PER_PAGE }
}
