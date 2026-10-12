import { z } from 'zod'

const email = z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ').max(254))

// Giới hạn trên 64 ký tự vì bcrypt chỉ xét 72 byte đầu
const newPassword = z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(64)

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Tên quá ngắn').max(80),
  email,
  password: newPassword,
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(64),
  newPassword,
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(64),
})
