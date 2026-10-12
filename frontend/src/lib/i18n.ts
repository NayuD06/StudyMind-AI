import { en } from './i18n.en.ts'

export type Lang = 'vi' | 'en'

const STORAGE_KEY = 'lang'

function readLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'vi' || saved === 'en') return saved
  } catch {
    // Trình duyệt chặn localStorage: dùng mặc định
  }
  return 'vi'
}

// Ngôn ngữ cố định trong suốt một lần tải trang, nên t() gọi được ở mọi nơi (kể cả hằng số ngoài component)
export const lang: Lang = readLang()
export const locale = lang === 'en' ? 'en-GB' : 'vi-VN'
document.documentElement.lang = lang

// Chuỗi tiếng Việt chính là khóa. Thiếu bản dịch thì hiện nguyên tiếng Việt.
// Chỗ trống viết {0}, {1}...: t('Còn {0} tài liệu', 3)
export function t(key: string, ...args: unknown[]) {
  const text = lang === 'en' ? (en[key] ?? key) : key
  return args.length ? text.replace(/\{(\d+)\}/g, (_, index) => String(args[Number(index)])) : text
}

// Tải lại trang để mọi chuỗi (kể cả hằng số đã tính sẵn) đổi theo; phiên đăng nhập tự khôi phục từ cookie
export function setLang(next: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    return
  }
  window.location.reload()
}
