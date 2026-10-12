import { describe, expect, it } from 'vitest'
import { testOutbox } from '../src/lib/mailer.js'
import { api, bearer, cookieOf, makeUser, PASSWORD, prisma } from './helpers.js'

const login = (email: string, password: string) => api().post('/api/auth/login').send({ email, password })
const refresh = (cookie: string) => api().post('/api/auth/refresh').set('Cookie', cookie)
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('đăng ký', () => {
  it('tạo tài khoản, trả access token và đặt cookie httpOnly', async () => {
    const email = `dk${Date.now()}@test.local`
    const res = await api().post('/api/auth/register').send({ name: 'Sinh viên mới', email, password: PASSWORD }).expect(201)

    expect(res.body.user).toMatchObject({ email, role: 'STUDENT' })
    expect(res.body.accessToken).toBeTypeOf('string')
    expect(res.body.user.passwordHash).toBeUndefined()
    const cookie = (res.headers['set-cookie'] as unknown as string[])[0]
    expect(cookie).toMatch(/^refresh_token=/)
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/SameSite=Strict/i)
  })

  it('từ chối email đã đăng ký và mật khẩu quá ngắn', async () => {
    const user = await makeUser()
    await api().post('/api/auth/register').send({ name: 'Trùng email', email: user.email, password: PASSWORD }).expect(409)
    await api().post('/api/auth/register').send({ name: 'Mật khẩu ngắn', email: 'ngan@test.local', password: '1234567' }).expect(400)
  })

  it('không cho tự đặt vai trò quản trị khi đăng ký', async () => {
    const email = `role${Date.now()}@test.local`
    const res = await api().post('/api/auth/register').send({ name: 'Leo quyền', email, password: PASSWORD, role: 'ADMIN' }).expect(201)
    expect(res.body.user.role).toBe('STUDENT')
  })
})

describe('đăng nhập', () => {
  it('sai mật khẩu và email không tồn tại nhận cùng một thông báo', async () => {
    const user = await makeUser()
    const wrong = await login(user.email, 'sai-mat-khau').expect(401)
    const unknown = await login('khong-co@test.local', PASSWORD).expect(401)
    expect(wrong.body.message).toBe(unknown.body.message)
  })

  it('route cần đăng nhập từ chối khi thiếu token hoặc token sai', async () => {
    const user = await makeUser()
    await api().get('/api/auth/me').expect(401)
    await api().get('/api/auth/me').set('Authorization', 'Bearer khong-phai-token').expect(401)
    const res = await api().get('/api/auth/me').set(bearer(user)).expect(200)
    expect(res.body.user.email).toBe(user.email)
  })

  it('trang quản trị chỉ nhận tài khoản ADMIN, và báo lỗi giống hệt sai mật khẩu', async () => {
    const student = await makeUser()
    const admin = await makeUser('ADMIN')
    const adminLogin = (email: string) => login(email, PASSWORD).set('X-Client', 'admin')

    const denied = await adminLogin(student.email).expect(401)
    expect(denied.body.message).toBe('Email hoặc mật khẩu không đúng')
    const ok = await adminLogin(admin.email).expect(200)
    expect(cookieOf(ok)).toMatch(/^admin_refresh_token=/)
  })

  it('tài khoản bị khóa không đăng nhập được và token đang dùng mất hiệu lực ngay', async () => {
    const user = await makeUser()
    await prisma.user.update({ where: { id: user.id }, data: { isLocked: true } })
    await login(user.email, PASSWORD).expect(403)
    await api().get('/api/auth/me').set(bearer(user)).expect(403)
    await refresh(user.cookie).expect(401)
  })
})

describe('làm mới phiên', () => {
  it('đổi refresh token lấy token mới', async () => {
    const user = await makeUser()
    const res = await refresh(user.cookie).expect(200)
    expect(res.body.accessToken).toBeTypeOf('string')
    expect(cookieOf(res)).not.toBe(user.cookie)
  })

  it('hai tab gửi cùng một token gần như cùng lúc thì cả hai vẫn đăng nhập', async () => {
    const user = await makeUser()
    const first = await refresh(user.cookie).expect(200)
    const second = await refresh(user.cookie).expect(200)
    await refresh(cookieOf(first)).expect(200)
    await refresh(cookieOf(second)).expect(200)
  })

  it('token đã đổi từ lâu mà bị gửi lại thì hủy mọi phiên của người dùng', async () => {
    const user = await makeUser()
    const next = await refresh(user.cookie).expect(200)
    // Giả lập token cũ đã được đổi từ một phút trước
    await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: { not: null } }, data: { revokedAt: new Date(Date.now() - 60_000) } })

    await refresh(user.cookie).expect(401)
    await refresh(cookieOf(next)).expect(401)
  })

  it('đăng xuất xong thì token không dùng lại được', async () => {
    const user = await makeUser()
    await api().post('/api/auth/logout').set('Cookie', user.cookie).expect(204)
    await refresh(user.cookie).expect(401)
  })
})

describe('đổi mật khẩu', () => {
  it('cần đúng mật khẩu hiện tại', async () => {
    const user = await makeUser()
    await api().post('/api/auth/change-password').set(bearer(user)).send({ currentPassword: 'sai', newPassword: 'mat-khau-moi-456' }).expect(400)
  })

  it('đổi xong thì mật khẩu cũ, token cũ và phiên cũ đều hết hiệu lực', async () => {
    const user = await makeUser()
    // Mốc hủy token tính theo giây, nên chờ sang giây khác cho token cũ chắc chắn nằm trước mốc
    await wait(1100)
    const res = await api()
      .post('/api/auth/change-password')
      .set(bearer(user))
      .send({ currentPassword: PASSWORD, newPassword: 'mat-khau-moi-456' })
      .expect(200)

    await login(user.email, PASSWORD).expect(401)
    await login(user.email, 'mat-khau-moi-456').expect(200)
    await api().get('/api/auth/me').set(bearer(user)).expect(401)
    await refresh(user.cookie).expect(401)
    // Thiết bị vừa đổi mật khẩu nhận phiên mới dùng được
    await api().get('/api/auth/me').set('Authorization', `Bearer ${res.body.accessToken}`).expect(200)
    await refresh(cookieOf(res)).expect(200)
  })
})

describe('quên mật khẩu', () => {
  const forgot = (email: string) => api().post('/api/auth/forgot-password').send({ email })
  const tokenFrom = (text: string) => text.match(/reset-password#(\S+)/)![1]
  const mailsTo = (email: string) => testOutbox.filter((mail) => mail.to === email)

  it('email không tồn tại vẫn trả 204 và không gửi thư nào', async () => {
    const before = testOutbox.length
    await forgot('khong-ai-ca@test.local').expect(204)
    expect(testOutbox.length).toBe(before)
  })

  it('gửi liên kết, đặt được mật khẩu mới, và liên kết chỉ dùng một lần', async () => {
    const user = await makeUser()
    await forgot(user.email).expect(204)
    const [mail] = mailsTo(user.email)
    expect(mail.text).toContain('http://app.test/reset-password#')
    const token = tokenFrom(mail.text)

    await api().post('/api/auth/reset-password').send({ token, newPassword: 'dat-lai-789-abc' }).expect(204)
    await login(user.email, PASSWORD).expect(401)
    await login(user.email, 'dat-lai-789-abc').expect(200)
    // Phiên cũ bị hủy theo
    await refresh(user.cookie).expect(401)
    await api().post('/api/auth/reset-password').send({ token, newPassword: 'lan-thu-hai-000' }).expect(400)
  })

  it('không lưu mã ở dạng đọc được trong database', async () => {
    const user = await makeUser()
    await forgot(user.email).expect(204)
    const token = tokenFrom(mailsTo(user.email)[0].text)
    const rows = await prisma.passwordResetToken.findMany({ where: { userId: user.id } })
    expect(rows).toHaveLength(1)
    expect(rows[0].tokenHash).not.toBe(token)
  })

  it('mã hết hạn hoặc mã bịa bị từ chối', async () => {
    const user = await makeUser()
    await forgot(user.email).expect(204)
    const token = tokenFrom(mailsTo(user.email)[0].text)
    await prisma.passwordResetToken.updateMany({ where: { userId: user.id }, data: { expiresAt: new Date(Date.now() - 1000) } })

    await api().post('/api/auth/reset-password').send({ token, newPassword: 'dat-lai-789-abc' }).expect(400)
    await api().post('/api/auth/reset-password').send({ token: 'x'.repeat(43), newPassword: 'dat-lai-789-abc' }).expect(400)
    await login(user.email, PASSWORD).expect(200)
  })

  it('mỗi tài khoản tối đa 3 thư mỗi giờ', async () => {
    const user = await makeUser()
    for (let i = 0; i < 5; i++) await forgot(user.email).expect(204)
    expect(mailsTo(user.email)).toHaveLength(3)
  })
})

describe('hồ sơ', () => {
  it('sửa tên, trường, ngành; không sửa được email hay vai trò', async () => {
    const user = await makeUser()
    const res = await api()
      .patch('/api/auth/me')
      .set(bearer(user))
      .send({ name: 'Tên mới', school: 'ĐH Thử nghiệm', major: '', role: 'ADMIN', email: 'khac@test.local' })
      .expect(200)

    expect(res.body.user).toMatchObject({ name: 'Tên mới', school: 'ĐH Thử nghiệm', major: null, role: 'STUDENT', email: user.email })
  })

  it('trang công khai của người dùng không lộ email', async () => {
    const user = await makeUser()
    const res = await api().get(`/api/users/${user.id}`).expect(200)
    expect(res.body.user).toMatchObject({ id: user.id, documentCount: 0, downloadCount: 0 })
    expect(JSON.stringify(res.body)).not.toContain(user.email)
    await api().get('/api/users/99999999').expect(404)
  })
})
