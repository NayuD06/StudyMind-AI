import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'

// Test chạy trên database riêng `studymind_test` (cùng máy chủ MySQL với DATABASE_URL),
// để không bao giờ đụng vào dữ liệu thật. Muốn trỏ chỗ khác thì đặt TEST_DATABASE_URL.
function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL
  if (!process.env.DATABASE_URL) throw new Error('Thiếu DATABASE_URL (hoặc TEST_DATABASE_URL) để chạy test')
  const url = new URL(process.env.DATABASE_URL)
  url.pathname = '/studymind_test'
  return url.toString()
}

const databaseUrl = testDatabaseUrl()
// Chốt chặn cuối: globalSetup xóa sạch database này trước khi chạy
if (!new URL(databaseUrl).pathname.endsWith('_test')) {
  throw new Error('Tên database dùng cho test phải kết thúc bằng "_test"')
}

const secret = () => randomBytes(32).toString('hex')

export const testEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: databaseUrl,
  JWT_ACCESS_SECRET: secret(),
  AI_SERVICE_KEY: secret(),
  UPLOAD_DIR: path.join(os.tmpdir(), 'studymind-test-uploads'),
  APP_URL: 'http://app.test',
  SMTP_HOST: '',
  TRUST_PROXY: '0',
}
