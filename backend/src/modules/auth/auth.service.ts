import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createHash, randomBytes } from 'node:crypto'
import type { User } from '@prisma/client'
import type { z } from 'zod'
import { env } from '../../config/env.js'
import { logAdminAction } from '../../lib/audit.js'
import { HttpError } from '../../lib/httpError.js'
import { sendMail } from '../../lib/mailer.js'
import { notify } from '../../lib/notify.js'
import { prisma } from '../../lib/prisma.js'
import type {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schema.js'

const BCRYPT_COST = 12
const ACCESS_TTL = '15m'
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000
// Token vừa được đổi vẫn dùng lại được trong khoảng này: hai tab mở cùng lúc gửi chung một cookie,
// tab đến sau không phải kẻ trộm. Đánh đổi: token bị lấy cắp cũng dùng lại được trong đúng khoảng đó.
const REUSE_GRACE_MS = 10_000
const RESET_TTL_MS = 30 * 60 * 1000
// Mỗi tài khoản tối đa chừng này thư đặt lại mật khẩu mỗi giờ, để không ai dội thư vào hộp thư người khác
const RESET_MAILS_PER_HOUR = 3

// So sánh với mã băm giả khi email không tồn tại để thời gian phản hồi không làm lộ email nào đã đăng ký
const DUMMY_HASH = bcrypt.hashSync('khong-ton-tai', BCRYPT_COST)

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

function toPublicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, school: user.school, major: user.major }
}

async function startSession(user: User) {
  const accessToken = jwt.sign({ id: user.id, role: user.role }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: ACCESS_TTL,
  })
  const refreshToken = randomBytes(32).toString('base64url')
  await prisma.refreshToken.create({
    data: { tokenHash: sha256(refreshToken), userId: user.id, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
  })
  return { user: toPublicUser(user), accessToken, refreshToken }
}

export async function register(input: z.infer<typeof registerSchema>) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new HttpError(409, 'Email này đã được đăng ký')

  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, BCRYPT_COST) },
  })
  return startSession(user)
}

// adminOnly: yêu cầu đến từ trang quản trị, chỉ tài khoản ADMIN mới được mở phiên ở đó
export async function login(input: z.infer<typeof loginSchema>, adminOnly = false, ip?: string) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  const ok = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH)
  // Tài khoản không phải admin nhận cùng một thông báo, để trang quản trị không xác nhận giúp mật khẩu nào là đúng
  if (!user || !ok || (adminOnly && user.role !== 'ADMIN')) throw new HttpError(401, 'Email hoặc mật khẩu không đúng')
  if (user.isLocked) throw new HttpError(403, 'Tài khoản đã bị khóa')
  if (adminOnly) await logAdminAction(user.id, 'ADMIN_LOGIN', 'Đăng nhập trang quản trị', ip)
  return startSession(user)
}

// Đổi refresh token cũ lấy cặp token mới; mỗi refresh token chỉ dùng được một lần
export async function refresh(token: string | undefined, adminOnly = false) {
  const invalid = new HttpError(401, 'Phiên đăng nhập đã hết hạn')
  if (!token) throw invalid

  const row = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } })
  if (!row) throw invalid

  // revokedAt chỉ được đặt khi token đã đổi lấy token mới (đăng xuất, khóa, đổi mật khẩu đều xóa hẳn dòng)
  if (row.revokedAt && Date.now() - row.revokedAt.getTime() > REUSE_GRACE_MS) {
    // Token đã đổi từ lâu mà vẫn được gửi lên: có thể đã bị đánh cắp, hủy mọi phiên của người dùng này
    await prisma.refreshToken.deleteMany({ where: { userId: row.userId } })
    throw invalid
  }
  if (row.expiresAt < new Date()) throw invalid

  // Request khác vừa đổi token này trước một nhịp thì không dòng nào được cập nhật;
  // vẫn trong khoảng ân hạn nên cấp phiên bình thường
  await prisma.refreshToken.updateMany({ where: { id: row.id, revokedAt: null }, data: { revokedAt: new Date() } })
  if (row.user.isLocked || (adminOnly && row.user.role !== 'ADMIN')) throw invalid

  return startSession(row.user)
}

export async function logout(token: string | undefined) {
  if (!token) return
  // Xóa hẳn để token đã đăng xuất không lọt vào khoảng ân hạn của refresh
  await prisma.refreshToken.deleteMany({ where: { tokenHash: sha256(token) } })
}

// Hủy mọi refresh token và làm mất hiệu lực mọi access token đã cấp trước mốc cutoff.
// Xóa hẳn chứ không đánh dấu thu hồi: nếu chỉ thu hồi, thiết bị khác gửi token cũ lên sẽ bị coi là
// token bị đánh cắp và kéo theo hủy luôn phiên mới vừa cấp.
function endAllSessions(userId: number, cutoff: Date, passwordHash?: string) {
  return prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { tokensValidAfter: cutoff, passwordHash } }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ])
}

// Đổi mật khẩu xong thì mọi thiết bị khác bị đăng xuất; thiết bị đang dùng nhận phiên mới
export async function changePassword(userId: number, input: z.infer<typeof changePasswordSchema>) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    throw new HttpError(400, 'Mật khẩu hiện tại không đúng')
  }
  if (input.newPassword === input.currentPassword) throw new HttpError(400, 'Mật khẩu mới phải khác mật khẩu hiện tại')

  // iat của token tính theo giây: làm tròn xuống để token cấp ngay sau đây không bị chính mốc này loại
  const cutoff = new Date(Math.floor(Date.now() / 1000) * 1000)
  await endAllSessions(userId, cutoff, await bcrypt.hash(input.newPassword, BCRYPT_COST))
  return startSession(user)
}

export async function logoutAll(userId: number) {
  // Làm tròn lên để cả token cấp trong cùng giây này cũng bị loại
  await endAllSessions(userId, new Date(Math.ceil(Date.now() / 1000) * 1000))
}

// Luôn kết thúc giống nhau dù email có tồn tại hay không, để không ai dò được email nào đã đăng ký.
// Thư được gửi ngầm (không await) vì cùng lý do: thời gian phản hồi không được khác nhau.
export async function requestPasswordReset(input: z.infer<typeof forgotPasswordSchema>) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user || user.isLocked) return

  const recent = await prisma.passwordResetToken.count({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
  })
  if (recent >= RESET_MAILS_PER_HOUR) return

  const token = randomBytes(32).toString('base64url')
  await prisma.passwordResetToken.create({
    data: { tokenHash: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  })
  // Mã nằm sau dấu # nên trình duyệt không gửi nó lên máy chủ nào và nó không lọt vào log truy cập
  const link = `${env.APP_URL}/reset-password#${token}`
  sendMail({
    to: user.email,
    subject: 'Đặt lại mật khẩu StudyMind AI',
    text: `Chào ${user.name},\n\nBấm vào liên kết sau để đặt mật khẩu mới (có hiệu lực 30 phút, dùng được một lần):\n${link}\n\nNếu bạn không yêu cầu, hãy bỏ qua thư này; mật khẩu của bạn không thay đổi.`,
  }).catch((err) => console.error('Gửi thư đặt lại mật khẩu thất bại:', err))
}

export async function resetPassword(input: z.infer<typeof resetPasswordSchema>) {
  const invalid = new HttpError(400, 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn')
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(input.token) }, include: { user: true } })
  if (!row || row.expiresAt < new Date() || row.user.isLocked) throw invalid

  // Xóa trước rồi mới đổi mật khẩu: hai request cùng một mã thì chỉ một cái xóa được
  const { count } = await prisma.passwordResetToken.deleteMany({ where: { id: row.id } })
  if (count === 0) throw invalid
  await prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } })

  await endAllSessions(row.userId, new Date(Math.ceil(Date.now() / 1000) * 1000), await bcrypt.hash(input.newPassword, BCRYPT_COST))
  await notify(row.userId, 'Mật khẩu của bạn vừa được đặt lại qua email. Nếu không phải bạn, hãy đổi mật khẩu ngay.')
}

export async function updateProfile(userId: number, input: z.infer<typeof profileSchema>) {
  return toPublicUser(await prisma.user.update({ where: { id: userId }, data: input }))
}

export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new HttpError(401, 'Tài khoản không tồn tại')
  return toPublicUser(user)
}
