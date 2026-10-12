import { prisma } from './prisma.js'

const SIX_HOURS = 6 * 60 * 60 * 1000

// Xóa refresh token đã hết hạn. Token đã thu hồi nhưng chưa hết hạn được giữ lại
// để còn phát hiện được trường hợp token cũ bị dùng lại.
export async function purgeExpiredRefreshTokens() {
  const { count } = await prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  if (count > 0) console.log(`Đã dọn ${count} refresh token hết hạn`)
  return count
}

export function startMaintenance() {
  const run = () => purgeExpiredRefreshTokens().catch((err) => console.error('Dọn refresh token thất bại:', err))
  run()
  // unref để bộ hẹn giờ không giữ tiến trình sống khi server tắt
  setInterval(run, SIX_HOURS).unref()
}
