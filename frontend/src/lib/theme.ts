import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

export type Theme = 'light' | 'dark'

// Giao diện hiện tại nằm ở <html data-theme>, do đoạn script trong index.html gắn trước khi React chạy
const read = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useTheme() {
  return useSyncExternalStore(subscribe, read)
}

export function toggleTheme() {
  const next: Theme = read() === 'dark' ? 'light' : 'dark'
  try {
    localStorage.setItem('theme', next)
  } catch {
    // Trình duyệt chặn localStorage: vẫn đổi được, chỉ là không nhớ cho lần sau
  }

  let applied = false
  const apply = () => {
    if (applied) return
    applied = true
    document.documentElement.dataset.theme = next
    // flushSync để nút bấm vẽ lại ngay trong khung hình mà hiệu ứng quét chụp
    flushSync(() => listeners.forEach((listener) => listener()))
  }
  // Hiệu ứng quét màn hình (theme-wipe trong index.css); trình duyệt cũ hoặc người tắt chuyển động thì đổi ngay
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (still || !document.startViewTransition) return apply()
  // Hiệu ứng bị hủy giữa chừng (bấm liên tiếp, cửa sổ bị che) thì thôi, giao diện vẫn đổi
  document.startViewTransition(apply).ready.catch(() => {})
  // Trình duyệt chỉ gọi apply khi vẽ được khung hình kế tiếp; cửa sổ đang bị che thì không có khung hình nào, nên tự đổi sau một nhịp
  window.setTimeout(apply, 250)
}
