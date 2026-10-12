import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { HttpError } from '../lib/httpError.js'
import { prisma } from '../lib/prisma.js'

export type AuthUser = { id: number; role: 'STUDENT' | 'ADMIN' }

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

const invalidToken = () => new HttpError(401, 'Token không hợp lệ hoặc đã hết hạn')

// Token chỉ dùng để biết "ai"; vai trò và trạng thái khóa luôn đọc lại từ DB.
// Nhờ vậy tài khoản vừa bị khóa, bị hạ quyền hoặc bị xóa mất quyền ngay, không phải đợi token hết hạn.
async function readUser(req: Request): Promise<AuthUser | undefined> {
  const token = req.headers.authorization?.replace(/^Bearer /, '')
  if (!token) return undefined

  let payload: { id: number; iat: number }
  try {
    // Cố định thuật toán để token ký bằng thuật toán khác bị từ chối
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as unknown as typeof payload
  } catch {
    throw invalidToken()
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, role: true, isLocked: true, tokensValidAfter: true },
  })
  if (!user) throw invalidToken()
  // Token cấp trước lần đổi mật khẩu hoặc "đăng xuất mọi thiết bị" gần nhất không còn dùng được
  if (user.tokensValidAfter && payload.iat * 1000 < user.tokensValidAfter.getTime()) throw invalidToken()
  if (user.isLocked) throw new HttpError(403, 'Tài khoản đã bị khóa')
  return { id: user.id, role: user.role }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = await readUser(req)
  if (!req.user) throw new HttpError(401, 'Chưa đăng nhập')
  next()
}

// Cho route công khai nhưng trả thêm dữ liệu nếu đã đăng nhập.
// Token sai vẫn trả 401 (không âm thầm coi là khách) để frontend biết mà làm mới phiên.
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = await readUser(req)
  next()
}

// Đặt sau requireAuth, nên req.user.role ở đây là vai trò hiện tại trong DB
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') throw new HttpError(403, 'Không có quyền')
  next()
}
