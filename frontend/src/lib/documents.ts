import { api } from './api.ts'
import { t } from './i18n.ts'

export type Subject = { id: number; name: string; slug: string }

export type DocSummary = {
  id: number
  title: string
  description: string | null
  school: string | null
  major: string | null
  pageCount: number | null
  fileSize: number
  viewCount: number
  downloadCount: number
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectReason: string | null
  createdAt: string
  uploader: { id: number; name: string }
  subjects: { subject: Subject }[]
  rating: { avg: number; count: number }
}

export type DocDetail = DocSummary & { myRating: number | null; isFavorite: boolean }

export type DocList = { items: DocSummary[]; total: number; page: number; limit: number }

// Tên môn lưu bằng tiếng Việt trong CSDL; môn có sẵn trong từ điển thì hiện bản dịch
export function subjectName(doc: DocSummary) {
  const name = doc.subjects[0]?.subject.name
  return name ? t(name) : null
}

// Mã ngắn ghép từ chữ cái đầu của tên môn: "Cơ sở dữ liệu" thành "CSDL"
export function subjectCode(doc: DocSummary) {
  const name = subjectName(doc)
  if (!name) return 'PDF'
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 4)
    .toUpperCase()
}

export const ratingText = (rating: DocSummary['rating']) => (rating.count ? rating.avg.toFixed(1) : '--')

export function fileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export async function fetchSubjects() {
  return (await api.get<{ items: Subject[] }>('/subjects')).data.items
}

export type DocQuery = {
  q?: string
  subjectId?: number
  uploaderId?: number
  school?: string
  major?: string
  minRating?: number
  sort?: 'new' | 'popular'
  page?: number
  limit?: number
}

export async function fetchDocuments(params: DocQuery) {
  return (await api.get<DocList>('/documents', { params })).data
}

// Các trường và ngành đang có tài liệu công khai, để đổ vào bộ lọc
export async function fetchFacets() {
  return (await api.get<{ schools: string[]; majors: string[] }>('/documents/facets')).data
}

// Lấy file qua axios (kèm token) để tài liệu chưa duyệt của chính mình vẫn mở được
export async function fetchFile(id: number, download = false) {
  const res = await api.get<Blob>(`/documents/${id}/file`, { params: download ? { download: 1 } : undefined, responseType: 'blob' })
  return res.data
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}
