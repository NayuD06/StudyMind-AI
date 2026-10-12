import { prisma } from './prisma.js'

export type AdminAction =
  | 'ADMIN_LOGIN'
  | 'DOCUMENT_APPROVE'
  | 'DOCUMENT_REJECT'
  | 'DOCUMENT_DELETE'
  | 'USER_LOCK'
  | 'USER_UNLOCK'
  | 'USER_ROLE'
  | 'SUBJECT_CREATE'
  | 'SUBJECT_UPDATE'
  | 'SUBJECT_DELETE'

// Ghi lại ai đã làm gì. summary lưu luôn tên/email của đối tượng lúc đó,
// để nhật ký vẫn đọc được sau khi đối tượng bị đổi tên hoặc xóa.
export async function logAdminAction(adminId: number, action: AdminAction, summary: string, ip?: string) {
  await prisma.adminLog.create({ data: { adminId, action, summary: summary.slice(0, 500), ip } })
}
