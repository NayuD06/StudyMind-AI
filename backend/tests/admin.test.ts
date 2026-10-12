import { beforeAll, describe, expect, it } from 'vitest'
import { api, bearer, makeUser, moderate, PASSWORD, prisma, publishedDoc, uploadDoc, type TestUser } from './helpers.js'

let admin: TestUser
let student: TestUser

beforeAll(async () => {
  admin = await makeUser('ADMIN')
  student = await makeUser()
})

describe('quyền vào khu quản trị', () => {
  it('sinh viên và khách đều bị chặn ở mọi route', async () => {
    for (const path of ['/stats', '/documents', '/reports', '/users', '/subjects', '/logs']) {
      await api().get(`/api/admin${path}`).expect(401)
      await api().get(`/api/admin${path}`).set(bearer(student)).expect(403)
    }
    await api().patch(`/api/admin/users/${admin.id}`).set(bearer(student)).send({ role: 'STUDENT' }).expect(403)
  })
})

describe('kiểm duyệt', () => {
  it('từ chối phải có lý do; người đăng nhận thông báo kèm lý do', async () => {
    const doc = await uploadDoc(student, { title: 'Tài liệu chờ xét' })
    await api().patch(`/api/admin/documents/${doc.id}/moderation`).set(bearer(admin)).send({ status: 'REJECTED' }).expect(400)
    await moderate(admin, doc.id, 'REJECTED', 'Nội dung không liên quan học tập')

    const mine = await api().get('/api/documents/mine').set(bearer(student)).expect(200)
    const row = mine.body.items.find((item: { id: number }) => item.id === doc.id)
    expect(row).toMatchObject({ moderationStatus: 'REJECTED', rejectReason: 'Nội dung không liên quan học tập' })
    const inbox = await api().get('/api/notifications').set(bearer(student)).expect(200)
    expect(inbox.body.items.some((item: { message: string }) => item.message.includes('Tài liệu chờ xét'))).toBe(true)
  })

  it('hàng chờ có tài liệu mới và mất đi sau khi duyệt', async () => {
    const doc = await uploadDoc(student)
    const ids = async () => {
      const res = await api().get('/api/admin/documents').set(bearer(admin)).expect(200)
      return res.body.items.map((item: { id: number }) => item.id)
    }
    expect(await ids()).toContain(doc.id)
    await moderate(admin, doc.id)
    expect(await ids()).not.toContain(doc.id)
  })

  it('gỡ tài liệu theo báo cáo: tài liệu rời thư viện, mọi báo cáo đang mở được đóng', async () => {
    const reporter = await makeUser()
    const second = await makeUser()
    const doc = await publishedDoc(student, admin)
    for (const user of [reporter, second]) {
      await api().post(`/api/documents/${doc.id}/reports`).set(bearer(user)).send({ reason: 'Tài liệu vi phạm bản quyền' }).expect(201)
    }
    const open = await api().get('/api/admin/reports').set(bearer(admin)).expect(200)
    const report = open.body.items.find((item: { document: { id: number } }) => item.document.id === doc.id)

    await api().patch(`/api/admin/reports/${report.id}`).set(bearer(admin)).send({ action: 'REMOVE' }).expect(400)
    await api().patch(`/api/admin/reports/${report.id}`).set(bearer(admin)).send({ action: 'REMOVE', reason: 'Vi phạm bản quyền' }).expect(204)
    await api().patch(`/api/admin/reports/${report.id}`).set(bearer(admin)).send({ action: 'DISMISS' }).expect(409)

    await api().get(`/api/documents/${doc.id}`).expect(404)
    expect(await prisma.report.count({ where: { documentId: doc.id, status: 'OPEN' } })).toBe(0)
  })
})

describe('quản lý người dùng', () => {
  it('không tự khóa hay tự hạ quyền chính mình', async () => {
    await api().patch(`/api/admin/users/${admin.id}`).set(bearer(admin)).send({ isLocked: true }).expect(400)
    await api().patch(`/api/admin/users/${admin.id}`).set(bearer(admin)).send({ role: 'STUDENT' }).expect(400)
  })

  it('khóa tài khoản thì người đó bị đẩy ra ngay và không đăng nhập lại được', async () => {
    const target = await makeUser()
    await api().patch(`/api/admin/users/${target.id}`).set(bearer(admin)).send({ isLocked: true }).expect(200)
    await api().get('/api/auth/me').set(bearer(target)).expect(403)
    await api().post('/api/auth/refresh').set('Cookie', target.cookie).expect(401)
    await api().post('/api/auth/login').send({ email: target.email, password: PASSWORD }).expect(403)
  })

  it('cấp quyền quản trị có hiệu lực sau khi đăng nhập lại, và được ghi nhật ký', async () => {
    const target = await makeUser()
    await api().patch(`/api/admin/users/${target.id}`).set(bearer(admin)).send({ role: 'ADMIN' }).expect(200)
    const login = await api().post('/api/auth/login').send({ email: target.email, password: PASSWORD }).expect(200)
    await api().get('/api/admin/stats').set('Authorization', `Bearer ${login.body.accessToken}`).expect(200)

    const logs = await api().get('/api/admin/logs').set(bearer(admin)).expect(200)
    expect(JSON.stringify(logs.body)).toContain(target.email)
  })
})

describe('môn học', () => {
  it('thêm, không cho trùng tên, đổi tên, xóa', async () => {
    const name = `Xác suất ${Date.now().toString(36)}`
    const created = await api().post('/api/admin/subjects').set(bearer(admin)).send({ name }).expect(201)
    const id = created.body.subject.id as number
    await api().post('/api/admin/subjects').set(bearer(admin)).send({ name }).expect(409)
    await api().post('/api/admin/subjects').set(bearer(admin)).send({ name: 'a' }).expect(400)

    const renamed = await api().patch(`/api/admin/subjects/${id}`).set(bearer(admin)).send({ name: `${name} thống kê` }).expect(200)
    expect(renamed.body.subject.name).toBe(`${name} thống kê`)
    await api().delete(`/api/admin/subjects/${id}`).set(bearer(admin)).expect(204)
    const publicList = await api().get('/api/subjects').expect(200)
    expect(JSON.stringify(publicList.body)).not.toContain(name)
  })
})

describe('thống kê', () => {
  it('có số người đăng ký 7 ngày, tài liệu và người đăng nổi bật', async () => {
    const uploader = await makeUser('STUDENT', 'Người đăng nhiều nhất')
    const doc = await publishedDoc(uploader, admin, { title: 'Tài liệu được tải nhiều' })
    // Xếp hạng người đăng theo số tài liệu đã duyệt, nên đăng thêm cho đủ dẫn đầu
    const most = await prisma.document.groupBy({ by: ['uploaderId'], where: { moderationStatus: 'APPROVED' }, _count: true })
    const target = Math.max(...most.map((row) => row._count)) + 1
    for (let i = 1; i < target; i++) await publishedDoc(uploader, admin)
    await prisma.document.update({ where: { id: doc.id }, data: { downloadCount: 100_000 } })

    const { body } = await api().get('/api/admin/stats').set(bearer(admin)).expect(200)

    expect(body.signups).toHaveLength(7)
    expect(body.uploads).toHaveLength(7)
    // Các tài khoản test đều vừa tạo nên rơi vào ngày cuối
    expect(body.signups.at(-1).count).toBeGreaterThan(0)
    expect(body.topDocuments[0]).toMatchObject({ id: doc.id, title: 'Tài liệu được tải nhiều', downloadCount: 100_000 })
    expect(body.topUploaders[0]).toMatchObject({ id: uploader.id, name: 'Người đăng nhiều nhất', documents: target, downloads: 100_000 })
    expect(body.topDocuments.length).toBeLessThanOrEqual(5)
  })
})
