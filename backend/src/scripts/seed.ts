// Tạo tài khoản quản trị viên đầu tiên và danh sách môn học. Chạy lại nhiều lần vẫn an toàn.
//   npm run db:seed
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const SUBJECTS = [
  { name: 'Cơ sở dữ liệu', slug: 'co-so-du-lieu' },
  { name: 'Cấu trúc dữ liệu và giải thuật', slug: 'cau-truc-du-lieu-va-giai-thuat' },
  { name: 'Mạng máy tính', slug: 'mang-may-tinh' },
  { name: 'Hệ điều hành', slug: 'he-dieu-hanh' },
  { name: 'Trí tuệ nhân tạo', slug: 'tri-tue-nhan-tao' },
  { name: 'Công nghệ phần mềm', slug: 'cong-nghe-phan-mem' },
  { name: 'Toán rời rạc', slug: 'toan-roi-rac' },
  { name: 'Lập trình web', slug: 'lap-trinh-web' },
]

const adminSchema = z.object({
  ADMIN_NAME: z.string().min(2).default('Quản trị viên'),
  ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email('ADMIN_EMAIL không hợp lệ')),
  ADMIN_PASSWORD: z.string().min(12, 'ADMIN_PASSWORD phải có ít nhất 12 ký tự'),
})

async function main() {
  for (const subject of SUBJECTS) {
    await prisma.subject.upsert({ where: { slug: subject.slug }, update: {}, create: subject })
  }
  console.log(`Đã có ${SUBJECTS.length} môn học`)

  const admin = adminSchema.parse(process.env)
  const existing = await prisma.user.findUnique({ where: { email: admin.ADMIN_EMAIL } })
  if (existing) {
    // Không ghi đè mật khẩu của tài khoản đã có; chỉ bảo đảm vai trò là ADMIN
    await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } })
    console.log(`Tài khoản ${admin.ADMIN_EMAIL} đã tồn tại, giữ nguyên mật khẩu và đặt vai trò ADMIN`)
  } else {
    await prisma.user.create({
      data: {
        name: admin.ADMIN_NAME,
        email: admin.ADMIN_EMAIL,
        passwordHash: await bcrypt.hash(admin.ADMIN_PASSWORD, 12),
        role: 'ADMIN',
      },
    })
    console.log(`Đã tạo quản trị viên ${admin.ADMIN_EMAIL} (mật khẩu lấy từ ADMIN_PASSWORD trong .env)`)
  }
}

main()
  .catch((err) => {
    console.error(err instanceof z.ZodError ? err.issues.map((issue) => issue.message).join('\n') : err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
