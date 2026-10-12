import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createHash, randomBytes } from 'node:crypto'
import type { User } from '@prisma/client'
import type { z } from 'zod'
import { env } from '../../config/env.js'
import { logAdminAction } from '../../lib/audit.js'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import type { loginSchema, registerSchema } from './auth.schema.js'

const BCRYPT_COST = 12
const ACCESS_TTL = '15m'
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000

// So sánh với mã băm giả khi email không tồn tại để thời gian phản hồi không làm lộ email nào đã đăng ký
const DUMMY_HASH = bcrypt.hashSync('khong-ton-tai', BCRYPT_COST)

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

function toPublicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email, role: user.role }
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

  if (row.revokedAt) {
    // Token đã thu hồi mà vẫn được gửi lên: có thể đã bị đánh cắp, hủy mọi phiên của người dùng này
    await prisma.refreshToken.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    throw invalid
  }
  if (row.expiresAt < new Date()) throw invalid

  // Điều kiện revokedAt: null bảo đảm hai request đồng thời không cùng đổi được một token
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: row.id, revokedAt: null },
    data: { revokedAt: new Date() },
  })
  if (count === 0) throw invalid
  if (row.user.isLocked || (adminOnly && row.user.role !== 'ADMIN')) throw invalid

  return startSession(row.user)
}

export async function logout(token: string | undefined) {
  if (!token) return
  await prisma.refreshToken.updateMany({
    where: { tokenHash: sha256(token), revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new HttpError(401, 'Tài khoản không tồn tại')
  return toPublicUser(user)
}
