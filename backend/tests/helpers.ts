import bcrypt from 'bcryptjs'
import PDFDocument from 'pdfkit'
import request from 'supertest'
import { app } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'

export { prisma }
export const api = () => request(app)

export const PASSWORD = 'mat-khau-thu-123'
// Cost thấp cho nhanh; mật khẩu thật vẫn băm với cost 12 trong auth.service
const passwordHash = bcrypt.hashSync(PASSWORD, 4)

let counter = 0
const unique = () => `${Date.now().toString(36)}${counter++}`

export type TestUser = { id: number; email: string; name: string; token: string; cookie: string }

// Lấy phần "tên=giá trị" của cookie refresh token trong phản hồi
export function cookieOf(res: request.Response) {
  const header = res.headers['set-cookie'] as unknown as string[] | undefined
  return header?.[0]?.split(';')[0] ?? ''
}

export const bearer = (user: Pick<TestUser, 'token'>) => ({ Authorization: `Bearer ${user.token}` })

export async function makeUser(role: 'STUDENT' | 'ADMIN' = 'STUDENT', name = 'Người thử'): Promise<TestUser> {
  const email = `u${unique()}@test.local`
  const user = await prisma.user.create({ data: { name, email, passwordHash, role } })
  const res = await api().post('/api/auth/login').send({ email, password: PASSWORD }).expect(200)
  return { id: user.id, email, name, token: res.body.accessToken, cookie: cookieOf(res) }
}

export async function makeSubject(name = `Môn ${unique()}`) {
  return prisma.subject.create({ data: { name, slug: `mon-${unique()}` } })
}

export function makePdf(text = 'Nội dung tài liệu thử'): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument()
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.text(text)
    doc.end()
  })
}

type DocFields = { title?: string; description?: string; school?: string; major?: string; subjectId?: number }

export async function uploadDoc(user: TestUser, fields: DocFields = {}, pdf?: Buffer) {
  const req = api()
    .post('/api/documents')
    .set(bearer(user))
    .field('title', fields.title ?? `Tài liệu ${unique()}`)
  for (const key of ['description', 'school', 'major', 'subjectId'] as const) {
    if (fields[key] !== undefined) req.field(key, String(fields[key]))
  }
  const res = await req.attach('file', pdf ?? (await makePdf()), { filename: 'thu.pdf', contentType: 'application/pdf' }).expect(201)
  return res.body.document as { id: number; title: string; moderationStatus: string }
}

export async function moderate(admin: TestUser, id: number, status: 'APPROVED' | 'REJECTED' = 'APPROVED', reason?: string) {
  await api().patch(`/api/admin/documents/${id}/moderation`).set(bearer(admin)).send({ status, reason }).expect(200)
}

// Tài liệu đã duyệt, sẵn sàng để thử các thao tác công khai
export async function publishedDoc(owner: TestUser, admin: TestUser, fields: DocFields = {}) {
  const doc = await uploadDoc(owner, fields)
  await moderate(admin, doc.id)
  return doc
}
