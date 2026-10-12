import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  // Bắt buộc đủ dài để không ai để nguyên giá trị mẫu hoặc đặt secret dễ đoán
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET phải có ít nhất 32 ký tự'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim())),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  AI_SERVICE_KEY: z.string().min(32, 'AI_SERVICE_KEY phải có ít nhất 32 ký tự'),
  UPLOAD_DIR: z.string().default('uploads'),
  // Địa chỉ trang sinh viên, dùng để tạo liên kết trong thư đặt lại mật khẩu
  APP_URL: z.string().default('http://localhost:5173'),
  // Gửi thư: bỏ trống SMTP_HOST thì thư chỉ được in ra màn hình chạy backend
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('StudyMind AI <no-reply@studymind.local>'),
  // Số reverse proxy đứng trước backend (nginx, Render...). Để 0 khi chạy thẳng trên máy;
  // đặt sai thì giới hạn tần suất tính nhầm IP (mọi người chung một IP, hoặc IP giả mạo được).
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
})

// Dừng ngay khi khởi động nếu thiếu biến môi trường, thay vì lỗi khó hiểu về sau
export const env = schema.parse(process.env)
export const isProduction = env.NODE_ENV === 'production'
