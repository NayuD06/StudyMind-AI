import { prisma } from './prisma.js'

// Thông báo trong trang cho một người dùng. documentId (nếu có) để bấm vào là mở được tài liệu.
export async function notify(userId: number, message: string, documentId?: number) {
  await prisma.notification.create({ data: { userId, message: message.slice(0, 500), documentId } })
}
