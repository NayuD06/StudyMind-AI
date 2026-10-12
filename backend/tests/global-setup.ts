import { execSync } from 'node:child_process'
import { rm } from 'node:fs/promises'
import { PrismaClient } from '@prisma/client'
import { testEnv } from './test-env.js'

// Chạy một lần trước cả bộ test: áp migration lên database test rồi xóa sạch dữ liệu của lượt trước
export default async function setup() {
  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: testEnv.DATABASE_URL }, stdio: 'pipe' })

  const prisma = new PrismaClient({ datasourceUrl: testEnv.DATABASE_URL })
  // Tài liệu và nhật ký không tự xóa theo người dùng nên phải xóa trước
  await prisma.adminLog.deleteMany()
  await prisma.document.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.user.deleteMany()
  await prisma.$disconnect()

  await rm(testEnv.UPLOAD_DIR, { recursive: true, force: true })
}
