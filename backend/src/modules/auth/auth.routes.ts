import { Router, type Request, type Response } from 'express'
import { isProduction } from '../../config/env.js'
import { requireAuth } from '../../middlewares/auth.js'
import { authLimiter, loginEmailLimiter, registerLimiter } from '../../middlewares/rateLimit.js'
import { changePasswordSchema, loginSchema, registerSchema } from './auth.schema.js'
import * as authService from './auth.service.js'

// Trang quản trị (thư mục admin/) gửi kèm header này. Nó dùng cookie riêng để phiên quản trị
// và phiên ở trang sinh viên không đè lên nhau khi mở cùng một trình duyệt.
const isAdminApp = (req: Request) => req.get('X-Client') === 'admin'
const cookieName = (req: Request) => (isAdminApp(req) ? 'admin_refresh_token' : 'refresh_token')

// httpOnly: JavaScript không đọc được nên XSS không lấy được token.
// sameSite strict + path hẹp: trình duyệt chỉ gửi cookie cho /api/auth từ chính trang của mình.
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/api/auth',
} as const

function sendSession(req: Request, res: Response, status: number, session: Awaited<ReturnType<typeof authService.login>>) {
  res.cookie(cookieName(req), session.refreshToken, { ...cookieOptions, maxAge: authService.REFRESH_TTL_MS })
  res.status(status).json({ user: session.user, accessToken: session.accessToken })
}

export const authRouter = Router()

authRouter.post('/register', authLimiter, registerLimiter, async (req, res) => {
  sendSession(req, res, 201, await authService.register(registerSchema.parse(req.body)))
})

authRouter.post('/login', authLimiter, loginEmailLimiter, async (req, res) => {
  sendSession(req, res, 200, await authService.login(loginSchema.parse(req.body), isAdminApp(req), req.ip))
})

authRouter.post('/refresh', async (req, res) => {
  try {
    sendSession(req, res, 200, await authService.refresh(req.cookies[cookieName(req)], isAdminApp(req)))
  } catch (err) {
    res.clearCookie(cookieName(req), cookieOptions)
    throw err
  }
})

authRouter.post('/logout', async (req, res) => {
  await authService.logout(req.cookies[cookieName(req)])
  res.clearCookie(cookieName(req), cookieOptions)
  res.status(204).end()
})

authRouter.post('/change-password', requireAuth, authLimiter, async (req, res) => {
  sendSession(req, res, 200, await authService.changePassword(req.user!.id, changePasswordSchema.parse(req.body)))
})

authRouter.post('/logout-all', requireAuth, async (req, res) => {
  await authService.logoutAll(req.user!.id)
  res.clearCookie(cookieName(req), cookieOptions)
  res.status(204).end()
})

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: await authService.getProfile(req.user!.id) })
})
