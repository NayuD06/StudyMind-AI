import { ipKeyGenerator, rateLimit } from 'express-rate-limit'

const base = { standardHeaders: 'draft-8', legacyHeaders: false } as const

// Mức chung cho toàn bộ API
export const apiLimiter = rateLimit({
  ...base,
  windowMs: 60_000,
  limit: 120,
  message: { message: 'Bạn gửi quá nhiều yêu cầu, thử lại sau ít phút.' },
})

// Đăng nhập và đăng ký: chỉ đếm lần thất bại để chặn dò mật khẩu
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { message: 'Thử quá nhiều lần, vui lòng đợi 15 phút.' },
})

// Dò mật khẩu của một tài khoản từ nhiều IP: đếm lần đăng nhập sai theo email.
// Đánh đổi: kẻ xấu có thể cố tình nhập sai để chủ tài khoản bị chặn đăng nhập 15 phút.
export const loginEmailLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = (req.body as { email?: unknown } | undefined)?.email
    return typeof email === 'string' ? `email:${email.trim().toLowerCase().slice(0, 254)}` : ipKeyGenerator(req.ip ?? '')
  },
  message: { message: 'Thử quá nhiều lần, vui lòng đợi 15 phút.' },
})

// Tạo tài khoản hàng loạt: authLimiter chỉ đếm lần thất bại nên cần đếm riêng số tài khoản tạo thành công
export const registerLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60_000,
  limit: 5,
  skipFailedRequests: true,
  message: { message: 'Bạn tạo quá nhiều tài khoản, thử lại sau một giờ.' },
})

// Tải tài liệu lên: giới hạn theo tài khoản để không bị spam file (đặt sau requireAuth)
export const uploadLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60_000,
  limit: 10,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip ?? '')),
  message: { message: 'Bạn đăng quá nhiều tài liệu, thử lại sau một giờ.' },
})

// Các API gọi AI tốn tiền nên giới hạn theo từng tài khoản (đặt sau requireAuth)
export const aiLimiter = rateLimit({
  ...base,
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip ?? '')),
  message: { message: 'Bạn hỏi AI quá nhanh, thử lại sau một phút.' },
})

const perUser = (req: { user?: { id: number }; ip?: string }) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip ?? ''))

// Bình luận và báo cáo: giới hạn theo tài khoản để không bị spam (đặt sau requireAuth)
export const commentLimiter = rateLimit({
  ...base,
  windowMs: 10 * 60_000,
  limit: 20,
  keyGenerator: perUser,
  message: { message: 'Bạn bình luận quá nhanh, thử lại sau ít phút.' },
})

export const reportLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60_000,
  limit: 10,
  keyGenerator: perUser,
  message: { message: 'Bạn gửi quá nhiều báo cáo, thử lại sau một giờ.' },
})
