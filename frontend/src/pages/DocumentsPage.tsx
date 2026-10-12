import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DocCard from '../components/DocCard.tsx'
import { errorMessage } from '../lib/api.ts'
import { fetchDocuments, fetchFacets, fetchSubjects } from '../lib/documents.ts'
import { useDebounced } from '../lib/useDebounced.ts'
import { t } from '../lib/i18n.ts'

type Mode = 'keyword' | 'semantic'

const SORTS = [
  { value: 'new', label: t('Mới nhất') },
  { value: 'popular', label: t('Tải nhiều') },
] as const

const RATINGS = [4, 3, 2]

export default function DocumentsPage() {
  // Từ khóa, các bộ lọc, cách sắp xếp và số trang nằm trên URL để chia sẻ hay bấm quay lại vẫn giữ nguyên
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const subjectId = Number(params.get('subject')) || undefined
  const school = params.get('school') ?? undefined
  const major = params.get('major') ?? undefined
  const minRating = RATINGS.find((value) => value === Number(params.get('rating')))
  const sort = params.get('sort') === 'popular' ? 'popular' : 'new'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [mode, setMode] = useState<Mode>('keyword')

  const search = useDebounced(query.trim())

  // Đổi bộ lọc nào thì cũng quay về trang 1
  function update(changes: Record<string, string | undefined>, keepPage = false) {
    const next = new URLSearchParams(params)
    if (!keepPage) next.delete('page')
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: true })
  }

  const subjects = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const facets = useQuery({ queryKey: ['documents', 'facets'], queryFn: fetchFacets })
  const documents = useQuery({
    queryKey: ['documents', search, subjectId, school, major, minRating, sort, page],
    queryFn: () => fetchDocuments({ q: search || undefined, subjectId, school, major, minRating, sort, page }),
    placeholderData: keepPreviousData,
  })
  const filtered = !!(search || subjectId || school || major || minRating)

  // Giá trị đang chọn trên URL có thể không còn trong danh sách (tài liệu cuối cùng của trường đó vừa bị gỡ)
  const options = (list: string[] | undefined, current: string | undefined) =>
    current && !list?.includes(current) ? [current, ...(list ?? [])] : (list ?? [])

  const data = documents.data
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">{t('Thư viện tài liệu')}</h1>

      <div className="mt-8 flex flex-col gap-4 md:flex-row">
        <input
          value={query}
          onChange={(e) => update({ q: e.target.value || undefined })}
          placeholder={t('Nhập từ khóa hoặc câu hỏi...')}
          aria-label={t('Tìm tài liệu')}
          className="field flex-1"
        />
        <div className="flex border-2 border-ink font-display text-sm font-bold">
          {(['keyword', 'semantic'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`flex-1 px-4 py-3 whitespace-nowrap transition-colors ${mode === value ? 'bg-ink text-paper' : 'bg-sheet hover:bg-mark'}`}
            >
              {value === 'keyword' ? t('Từ khóa') : t('Ngữ nghĩa')}
            </button>
          ))}
        </div>
      </div>

      {mode === 'semantic' && (
        <p className="mt-3 border-l-4 border-flame bg-sheet px-3 py-2 text-sm">
          {t('Tìm kiếm ngữ nghĩa cần AI service. Hiện kết quả vẫn đang lọc theo từ khóa.')}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {[null, ...(subjects.data ?? [])].map((item) => {
          const active = (item?.id ?? undefined) === subjectId
          return (
            <button
              key={item?.id ?? 'all'}
              onClick={() => update({ subject: item ? String(item.id) : undefined })}
              className={`border-2 border-ink px-3 py-1 text-sm transition-colors ${active ? 'bg-mark font-medium' : 'bg-sheet hover:bg-mark/40'}`}
            >
              {item ? t(item.name) : t('Tất cả')}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <select value={school ?? ''} onChange={(e) => update({ school: e.target.value || undefined })} aria-label={t('Lọc theo trường')} className={`chip-select ${school ? 'bg-mark' : ''}`}>
          <option value="">{t('Mọi trường')}</option>
          {options(facets.data?.schools, school).map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={major ?? ''} onChange={(e) => update({ major: e.target.value || undefined })} aria-label={t('Lọc theo ngành')} className={`chip-select ${major ? 'bg-mark' : ''}`}>
          <option value="">{t('Mọi ngành')}</option>
          {options(facets.data?.majors, major).map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={minRating ?? ''}
          onChange={(e) => update({ rating: e.target.value || undefined })}
          aria-label={t('Lọc theo điểm đánh giá')}
          className={`chip-select ${minRating ? 'bg-mark' : ''}`}
        >
          <option value="">{t('Mọi đánh giá')}</option>
          {RATINGS.map((value) => (
            <option key={value} value={value}>
              {t('Từ {0} ★ trở lên', value)}
            </option>
          ))}
        </select>
        {filtered && (
          <button onClick={() => setParams(sort === 'popular' ? { sort } : {}, { replace: true })} className="text-muted underline underline-offset-4 hover:text-ink">
            {t('Xóa bộ lọc')}
          </button>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">{data ? t('{0} tài liệu', data.total) : t('Đang tải dữ liệu...')}</p>
        <div className="flex gap-4 text-sm">
          {SORTS.map((item) => (
            <button
              key={item.value}
              onClick={() => update({ sort: item.value === 'new' ? undefined : item.value })}
              className={`link-wipe ${sort === item.value ? 'active font-medium' : 'text-muted'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {documents.isError && (
        <p role="alert" className="mt-4 border-l-4 border-flame bg-sheet px-3 py-2 text-sm">
          {errorMessage(documents.error)}
        </p>
      )}

      {data && data.items.length > 0 && (
        <div className={`mt-4 stagger grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-4 ${documents.isPlaceholderData ? 'opacity-50' : ''}`}>
          {data.items.map((doc) => (
            <DocCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="panel mt-4 px-6 py-14 text-center">
          <p className="font-display text-2xl font-bold">
            {filtered ? t('Không tìm thấy tài liệu phù hợp') : t('Thư viện chưa có tài liệu nào')}
          </p>
          <p className="mt-2 text-muted">
            {filtered ? t('Thử từ khóa khác hoặc bỏ bớt bộ lọc.') : t('Hãy là người đầu tiên đăng tài liệu.')}
          </p>
        </div>
      )}

      {data && pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button disabled={page <= 1} onClick={() => update({ page: String(page - 1) }, true)} className="btn btn-sm disabled:opacity-40">
            {t('← Trước')}
          </button>
          <span className="text-sm">
            {t('Trang')} {page}/{pages}
          </span>
          <button disabled={page >= pages} onClick={() => update({ page: String(page + 1) }, true)} className="btn btn-sm disabled:opacity-40">
            {t('Sau →')}
          </button>
        </div>
      )}
    </div>
  )
}
