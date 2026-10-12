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
})

// Dừng ngay khi khởi động nếu thiếu biến môi trường, thay vì lỗi khó hiểu về sau
export const env = schema.parse(process.env)
export const isProduction = env.NODE_ENV === 'production'
