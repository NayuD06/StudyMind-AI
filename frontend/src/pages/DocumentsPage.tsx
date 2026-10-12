import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DocCard from '../components/DocCard.tsx'
import Reveal from '../components/Reveal.tsx'
import { errorMessage } from '../lib/api.ts'
import { fetchDocuments, fetchSubjects } from '../lib/documents.ts'
import { useDebounced } from '../lib/useDebounced.ts'

type Mode = 'keyword' | 'semantic'

const SORTS = [
  { value: 'new', label: 'MỚI NHẤT' },
  { value: 'popular', label: 'TẢI NHIỀU' },
] as const

export default function DocumentsPage() {
  // Từ khóa, môn, cách sắp xếp và số trang nằm trên URL để chia sẻ hay bấm quay lại vẫn giữ nguyên
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const subjectId = Number(params.get('subject')) || undefined
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
  const documents = useQuery({
    queryKey: ['documents', search, subjectId, sort, page],
    queryFn: () => fetchDocuments({ q: search || undefined, subjectId, sort, page }),
    placeholderData: keepPreviousData,
  })

  const data = documents.data
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="font-mono text-xs text-muted">/ THƯ VIỆN</p>
      <h1 className="mt-2 font-display text-5xl font-bold">
        <span className="block overflow-hidden pb-1">
          <span className="block animate-rise">Thư viện tài liệu</span>
        </span>
      </h1>

      <div className="mt-8 flex flex-col gap-4 md:flex-row">
        <input
          value={query}
          onChange={(e) => update({ q: e.target.value || undefined })}
          placeholder="Nhập từ khóa hoặc câu hỏi..."
          aria-label="Tìm tài liệu"
          className="field flex-1"
        />
        <div className="flex border-2 border-ink font-display text-sm font-bold">
          {(['keyword', 'semantic'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`flex-1 px-4 py-3 transition-colors ${mode === value ? 'bg-ink text-paper' : 'bg-sheet hover:bg-mark'}`}
            >
              {value === 'keyword' ? 'TỪ KHÓA' : 'NGỮ NGHĨA'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'semantic' && (
        <p className="mt-3 animate-pop border-l-4 border-flame bg-sheet px-3 py-2 font-mono text-xs">
          Tìm kiếm ngữ nghĩa cần AI service. Hiện kết quả vẫn đang lọc theo từ khóa.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {[null, ...(subjects.data ?? [])].map((item) => {
          const active = (item?.id ?? undefined) === subjectId
          return (
            <button
              key={item?.id ?? 'all'}
              onClick={() => update({ subject: item ? String(item.id) : undefined })}
              className={`border-2 border-ink px-3 py-1 text-sm transition duration-150 hover:-translate-y-0.5 ${active ? 'bg-mark shadow-[3px_3px_0_var(--color-ink)]' : 'bg-sheet'}`}
            >
              {item?.name ?? 'Tất cả'}
            </button>
          )
        })}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="font-mono text-xs text-muted">{data ? `${data.total} KẾT QUẢ` : 'ĐANG TẢI...'}</p>
        <div className="flex gap-4 font-mono text-xs">
          {SORTS.map((item) => (
            <button
              key={item.value}
              onClick={() => update({ sort: item.value === 'new' ? undefined : item.value })}
              className={`link-wipe ${sort === item.value ? 'active font-semibold' : 'text-muted'}`}
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
        <div className={`mt-4 grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-4 ${documents.isPlaceholderData ? 'opacity-50' : ''}`}>
          {data.items.map((doc, i) => (
            <Reveal key={doc.id} delay={(i % 4) * 70}>
              <DocCard doc={doc} />
            </Reveal>
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="panel mt-4 px-6 py-14 text-center">
          <p className="font-display text-2xl font-bold">
            {search || subjectId ? 'Không tìm thấy tài liệu phù hợp' : 'Thư viện chưa có tài liệu nào'}
          </p>
          <p className="mt-2 text-muted">
            {search || subjectId ? 'Thử từ khóa khác hoặc bỏ bộ lọc môn học.' : 'Hãy là người đầu tiên đăng tài liệu.'}
          </p>
        </div>
      )}

      {data && pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button disabled={page <= 1} onClick={() => update({ page: String(page - 1) }, true)} className="btn btn-sm disabled:opacity-40">
            ← Trước
          </button>
          <span className="font-mono text-xs">
            TRANG {page}/{pages}
          </span>
          <button disabled={page >= pages} onClick={() => update({ page: String(page + 1) }, true)} className="btn btn-sm disabled:opacity-40">
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}
