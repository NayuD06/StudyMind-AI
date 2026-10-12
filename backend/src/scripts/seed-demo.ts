// Dữ liệu mẫu để demo: sinh viên, tài liệu PDF, đánh giá, lượt lưu, lượt tải, bình luận, báo cáo, thông báo.
// Cần chạy `npm run db:seed` trước (môn học và tài khoản quản trị).
//   npm run db:seed:demo            xóa dữ liệu mẫu cũ rồi tạo lại
//   npm run db:seed:demo -- --clear chỉ xóa dữ liệu mẫu
// Chỉ đụng tới tài khoản có email @demo.studymind.local và những gì thuộc về các tài khoản đó.
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import PDFDocument from 'pdfkit'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { filePath } from '../modules/documents/documents.service.js'
import { inspectPdf } from '../modules/documents/pdf.js'
import { COMMENTS, DEMO_DOMAIN, DOCUMENTS, REPORT_REASONS, STUDENTS, type DemoDocument } from './seed-demo.data.js'

const HOUR_MS = 60 * 60 * 1000

// Font có dấu tiếng Việt: [thường, đậm]. Không tìm thấy thì dùng Helvetica và bỏ dấu.
const FONTS = [
  ['C:/Windows/Fonts/arial.ttf', 'C:/Windows/Fonts/arialbd.ttf'],
  ['/System/Library/Fonts/Supplemental/Arial.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'],
  ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'],
]
const font = FONTS.find((pair) => pair.every((file) => existsSync(file)))
const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\x20-\x7e\n]/g, '?')
const t = (text: string) => (font ? text : plain(text))

// Số ngẫu nhiên có hạt giống cố định: chạy lại ra đúng bộ dữ liệu cũ
let state = 20261012
function random() {
  state = (state + 0x6d2b79f5) | 0
  let x = Math.imul(state ^ (state >>> 15), 1 | state)
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296
}
const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1))
const pick = <T>(items: T[]) => items[int(0, items.length - 1)]
const sample = <T>(items: T[], count: number) =>
  items
    .map((item) => ({ item, order: random() }))
    .sort((a, b) => a.order - b.order)
    .slice(0, count)
    .map(({ item }) => item)

function buildPdf(doc: DemoDocument, author: string) {
  return new Promise<Buffer>((resolve, reject) => {
    const pdf = new PDFDocument({ size: 'A4', margin: 64, info: { Title: t(doc.title), Author: t(author) } })
    const chunks: Buffer[] = []
    pdf.on('data', (chunk: Buffer) => chunks.push(chunk))
    pdf.on('end', () => resolve(Buffer.concat(chunks)))
    pdf.on('error', reject)

    const [regular, bold] = font ?? ['Helvetica', 'Helvetica-Bold']
    doc.sections.forEach(([heading, body], index) => {
      if (index > 0) pdf.addPage()
      if (index === 0) {
        pdf.font(bold).fontSize(22).text(t(doc.title))
        pdf.moveDown(0.4).font(regular).fontSize(11).fillColor('#666666').text(t(`${author} · ${doc.description}`))
        pdf.moveDown(1.5).fillColor('#000000')
      }
      pdf.font(bold).fontSize(15).text(t(`${index + 1}. ${heading}`))
      pdf.moveDown(0.6).font(regular).fontSize(12).text(t(body), { lineGap: 4, paragraphGap: 8 })
    })
    pdf.end()
  })
}

async function clearDemo() {
  const users = await prisma.user.findMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } }, select: { id: true } })
  const userIds = users.map((user) => user.id)
  const documents = await prisma.document.findMany({ where: { uploaderId: { in: userIds } }, select: { id: true, storageKey: true } })

  // Bình luận, đánh giá, báo cáo, thông báo... tự xóa theo tài liệu và tài khoản (onDelete: Cascade)
  await prisma.document.deleteMany({ where: { id: { in: documents.map((doc) => doc.id) } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await Promise.all(documents.map((doc) => unlink(filePath(doc.storageKey)).catch(() => {})))
  return { users: users.length, documents: documents.length }
}

async function main() {
  const removed = await clearDemo()
  if (removed.users) console.log(`Đã xóa dữ liệu mẫu cũ: ${removed.users} tài khoản, ${removed.documents} tài liệu`)
  if (process.argv.includes('--clear')) return

  const { DEMO_PASSWORD } = z.object({ DEMO_PASSWORD: z.string().min(8, 'Thiếu DEMO_PASSWORD (ít nhất 8 ký tự) trong backend/.env').max(64) }).parse(process.env)
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { id: 'asc' } })
  const subjects = new Map((await prisma.subject.findMany()).map((subject) => [subject.slug, subject.id]))
  if (!admin || subjects.size === 0) throw new Error('Chưa có tài khoản quản trị hoặc môn học. Chạy "npm run db:seed" trước.')
  if (!font) console.log('Không tìm thấy font có dấu tiếng Việt, nội dung PDF sẽ được viết không dấu.')

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
  const now = Date.now()
  const students = []
  for (const student of STUDENTS) {
    students.push(await prisma.user.create({ data: { ...student, passwordHash, createdAt: new Date(now - int(12, 30) * 24 * HOUR_MS) } }))
  }

  await mkdir(path.dirname(filePath('x')), { recursive: true })
  const count = { ratings: 0, favorites: 0, downloads: 0, comments: 0, reports: 0, notifications: 0 }
  const approved: { id: number; title: string; uploaderId: number }[] = []

  for (const [index, item] of DOCUMENTS.entries()) {
    const uploader = students[index % students.length]
    const status = item.status ?? 'APPROVED'
    const subjectId = subjects.get(item.subject)
    if (!subjectId) throw new Error(`Không có môn học "${item.subject}". Chạy "npm run db:seed" trước.`)

    const buffer = await buildPdf(item, uploader.name)
    const { pageCount, piiFindings } = await inspectPdf(buffer)
    const storageKey = `${randomUUID()}.pdf`
    await writeFile(filePath(storageKey), buffer)

    // Rải ngày đăng trong 9 ngày gần đây để biểu đồ ở trang quản trị có số liệu
    const createdAt = new Date(now - (((index * 13) % 216) + 3) * HOUR_MS)
    const reviewedAt = status === 'PENDING' ? null : new Date(createdAt.getTime() + int(1, 3) * HOUR_MS)
    const others = students.filter((student) => student.id !== uploader.id)
    const downloaders = status === 'APPROVED' ? sample(others, int(1, others.length)) : []

    const document = await prisma.document.create({
      data: {
        title: item.title,
        description: item.description,
        school: uploader.school,
        major: uploader.major,
        storageKey,
        fileName: `${plain(item.title).replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}.pdf`,
        fileSize: buffer.length,
        pageCount,
        piiFindings: piiFindings.length ? piiFindings : undefined,
        moderationStatus: status,
        rejectReason: item.rejectReason,
        reviewedAt,
        reviewedById: reviewedAt ? admin.id : null,
        viewCount: status === 'APPROVED' ? downloaders.length * int(4, 9) + int(5, 40) : 0,
        downloadCount: downloaders.length,
        uploaderId: uploader.id,
        createdAt,
        subjects: { create: [{ subjectId }] },
      },
    })

    // Thời điểm bất kỳ sau khi tài liệu được duyệt, không vượt quá hiện tại
    const after = (from: Date) => new Date(from.getTime() + random() * (now - from.getTime()))
    const notifications: { userId: number; message: string; documentId: number; createdAt: Date; readAt: Date | null }[] = []

    if (status === 'REJECTED' && reviewedAt) {
      notifications.push({ userId: uploader.id, message: `Tài liệu "${item.title}" bị từ chối. Lý do: ${item.rejectReason}`, documentId: document.id, createdAt: reviewedAt, readAt: null })
    }
    if (status === 'APPROVED' && reviewedAt) {
      approved.push({ id: document.id, title: item.title, uploaderId: uploader.id })
      notifications.push({ userId: uploader.id, message: `Tài liệu "${item.title}" đã được duyệt và hiện trong thư viện.`, documentId: document.id, createdAt: reviewedAt, readAt: reviewedAt })

      const raters = sample(downloaders, int(1, downloaders.length))
      const savers = sample(others, int(0, 3))
      const commenters = sample(others, int(0, 3))
      await prisma.download.createMany({ data: downloaders.map((user) => ({ userId: user.id, documentId: document.id, createdAt: after(reviewedAt) })) })
      await prisma.rating.createMany({ data: raters.map((user) => ({ userId: user.id, documentId: document.id, score: pick([3, 4, 4, 5, 5, 5]), createdAt: after(reviewedAt) })) })
      await prisma.favorite.createMany({ data: savers.map((user) => ({ userId: user.id, documentId: document.id, createdAt: after(reviewedAt) })) })

      const texts = sample(COMMENTS, commenters.length)
      for (const [i, user] of commenters.entries()) {
        const commentedAt = after(reviewedAt)
        await prisma.comment.create({ data: { content: texts[i], userId: user.id, documentId: document.id, createdAt: commentedAt } })
        notifications.push({ userId: uploader.id, message: `${user.name} đã bình luận về tài liệu "${item.title}"`, documentId: document.id, createdAt: commentedAt, readAt: null })
      }
      count.downloads += downloaders.length
      count.ratings += raters.length
      count.favorites += savers.length
      count.comments += commenters.length
    }

    await prisma.notification.createMany({ data: notifications })
    count.notifications += notifications.length
  }

  // Vài báo cáo đang chờ để trang Báo cáo của quản trị có việc xử lý
  for (const [i, reason] of REPORT_REASONS.entries()) {
    const target = approved[(i * 5 + 2) % approved.length]
    const reporter = students.find((student) => student.id !== target.uploaderId)!
    await prisma.report.create({ data: { reason, userId: reporter.id, documentId: target.id, createdAt: new Date(now - (i + 2) * HOUR_MS) } })
    count.reports++
  }

  const pending = DOCUMENTS.filter((doc) => doc.status === 'PENDING').length
  const rejected = DOCUMENTS.filter((doc) => doc.status === 'REJECTED').length
  console.log(`Đã tạo ${students.length} sinh viên (email @${DEMO_DOMAIN}, mật khẩu là DEMO_PASSWORD trong .env)`)
  console.log(`Đã tạo ${DOCUMENTS.length} tài liệu: ${approved.length} đã duyệt, ${pending} chờ duyệt, ${rejected} bị từ chối`)
  console.log(`  ${count.ratings} đánh giá, ${count.favorites} lượt lưu, ${count.downloads} lượt tải, ${count.comments} bình luận, ${count.reports} báo cáo, ${count.notifications} thông báo`)
  console.log('Tài khoản mẫu:')
  for (const student of students) console.log(`  ${student.email}  (${student.name})`)
}

main()
  .catch((err) => {
    console.error(err instanceof z.ZodError ? err.issues.map((issue) => issue.message).join('\n') : err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
