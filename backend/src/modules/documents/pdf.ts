import { getDocumentProxy } from 'unpdf'
import { HttpError } from '../../lib/httpError.js'

const MAX_PAGES = 1000
// Chỉ quét thông tin cá nhân ở các trang đầu: bìa và trang giới thiệu là nơi hay có email, số điện thoại
const PII_SCAN_PAGES = 30
const MAX_FINDINGS = 10

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
// Số di động Việt Nam: 0xxxxxxxxx hoặc +84xxxxxxxxx, cho phép ngăn cách bằng dấu cách, chấm, gạch
const PHONE = /(?:\+84|\b0)(?:[\s.-]?\d){9}\b/g

export type PiiFinding = { type: 'email' | 'phone'; page: number; sample: string }

// Che bớt để cảnh báo mà không lưu lại nguyên thông tin cá nhân
function mask(value: string, type: PiiFinding['type']) {
  if (type === 'email') {
    const [name, domain] = value.split('@')
    return `${name.slice(0, 2)}***@${domain}`
  }
  const digits = value.replace(/\D/g, '')
  return `${digits.slice(0, 3)}*****${digits.slice(-2)}`
}

export function findPii(text: string, page: number): PiiFinding[] {
  const emails = (text.match(EMAIL) ?? []).map((value) => ({ type: 'email' as const, page, sample: mask(value, 'email') }))
  const phones = (text.match(PHONE) ?? []).map((value) => ({ type: 'phone' as const, page, sample: mask(value, 'phone') }))
  return [...emails, ...phones]
}

// Kiểm tra file tải lên thật sự là PDF đọc được, trả về số trang và thông tin cá nhân phát hiện được
export async function inspectPdf(buffer: Buffer) {
  // Không tin đuôi file hay MIME do trình duyệt gửi: PDF thật luôn bắt đầu bằng "%PDF-"
  if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new HttpError(400, 'File không phải PDF hợp lệ')
  }

  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    if (pdf.numPages > MAX_PAGES) throw new HttpError(400, `Tài liệu vượt quá ${MAX_PAGES} trang`)

    const findings: PiiFinding[] = []
    for (let number = 1; number <= Math.min(pdf.numPages, PII_SCAN_PAGES); number++) {
      const content = await (await pdf.getPage(number)).getTextContent()
      const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ')
      findings.push(...findPii(text, number))
    }

    // Bỏ các mẫu trùng nhau (ví dụ email ở chân mọi trang)
    const unique = [...new Map(findings.map((finding) => [finding.sample, finding])).values()]
    return { pageCount: pdf.numPages, piiFindings: unique.slice(0, MAX_FINDINGS) }
  } catch (err) {
    if (err instanceof HttpError) throw err
    throw new HttpError(400, 'Không đọc được file PDF (file hỏng hoặc có mật khẩu)')
  }
}
