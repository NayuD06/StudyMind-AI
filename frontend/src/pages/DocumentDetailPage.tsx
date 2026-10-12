import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { lazy, Suspense, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'
import { fetchFile, fileSize, ratingText, saveBlob, subjectCode, subjectName, type DocDetail } from '../lib/documents.ts'

// pdf.js khá nặng nên chỉ tải khi mở trang chi tiết
const PdfViewer = lazy(() => import('../components/PdfViewer.tsx'))

type Message = { role: 'user' | 'assistant'; text: string }

const TABS = ['Thông tin', 'Hỏi đáp', 'Tóm tắt', 'Ôn tập']

const STATUS_NOTE = {
  PENDING: 'Tài liệu đang chờ quản trị viên duyệt. Hiện chỉ bạn xem được.',
  REJECTED: 'Tài liệu đã bị từ chối và không hiện trong thư viện.',
}

export default function DocumentDetailPage() {
  const id = Number(useParams().id)
  const { user, loading } = useAuth()
  const client = useQueryClient()
  const key = ['document', id, user?.id ?? null]

  const [tab, setTab] = useState(TABS[0])
  const [input, setInput] = useState('')
  const [hover, setHover] = useState(0)
  const [notice, setNotice] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hãy đặt câu hỏi về nội dung tài liệu này.' },
  ])

  // Chờ khôi phục phiên xong mới gọi, để tài liệu chưa duyệt của chính mình không bị báo 404 oan
  const detail = useQuery({
    queryKey: key,
    queryFn: async () => (await api.get<{ document: DocDetail }>(`/documents/${id}`)).data.document,
    enabled: !loading && Number.isInteger(id) && id > 0,
    staleTime: 60_000,
    retry: (count, error) => !(axios.isAxiosError(error) && error.response?.status === 404) && count < 2,
  })

  const patch = (changes: Partial<DocDetail>) =>
    client.setQueryData<DocDetail>(key, (old) => (old ? { ...old, ...changes } : old))
  const fail = (error: unknown) => setNotice(errorMessage(error))

  const favorite = useMutation({
    mutationFn: async (saved: boolean) =>
      (await api.request<{ isFavorite: boolean }>({ url: `/documents/${id}/favorite`, method: saved ? 'PUT' : 'DELETE' })).data,
    onSuccess: (data) => {
      patch(data)
      client.invalidateQueries({ queryKey: ['favorites'] })
    },
    onError: fail,
  })

  const rate = useMutation({
    mutationFn: async (score: number) =>
      (await api.put<Pick<DocDetail, 'rating' | 'myRating'>>(`/documents/${id}/rating`, { score })).data,
    onSuccess: (data) => {
      patch(data)
      client.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: fail,
  })

  const download = useMutation({
    mutationFn: () => fetchFile(id, true),
    onSuccess: (blob) => {
      const doc = detail.data!
      saveBlob(blob, `${doc.title}.pdf`)
      patch({ downloadCount: doc.downloadCount + 1 })
    },
    onError: fail,
  })

  function send(e: FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: input.trim() },
      { role: 'assistant', text: 'AI service chưa được kết nối nên chưa thể trả lời.' },
    ])
    setInput('')
  }

  if (detail.isError || Number.isNaN(id)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h1 className="font-display text-4xl font-bold">Không tìm thấy tài liệu</h1>
        <p className="mt-3 text-muted">{detail.isError ? errorMessage(detail.error) : 'Đường dẫn không hợp lệ.'}</p>
        <Link to="/documents" className="btn mt-6">
          ← Về thư viện
        </Link>
      </div>
    )
  }

  const doc = detail.data
  if (!doc) return <p className="mx-auto max-w-6xl px-4 py-20 font-mono text-xs text-muted">ĐANG TẢI...</p>

  const isPublic = doc.moderationStatus === 'APPROVED'
  const isMine = user?.id === doc.uploader.id
  const stars = hover || doc.myRating || 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/documents" className="link-wipe font-mono text-xs">
        ← THƯ VIỆN
      </Link>

      {!isPublic && (
        <p className="mt-4 animate-pop border-l-4 border-flame bg-mark/40 px-3 py-2 text-sm">
          {STATUS_NOTE[doc.moderationStatus as keyof typeof STATUS_NOTE]}
          {doc.rejectReason && <b> Lý do: {doc.rejectReason}</b>}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted">
            <span className="bg-ink px-1.5 py-0.5 text-paper">{subjectCode(doc)}</span>{' '}
            {[subjectName(doc), doc.school].filter(Boolean).join(' · ') || 'Chưa phân môn'}
          </p>
          <h1 className="mt-3 overflow-hidden font-display text-4xl font-bold">
            <span className="block animate-rise">{doc.title}</span>
          </h1>
          <p className="mt-2 font-mono text-xs text-muted">
            {doc.pageCount ?? '?'} trang · ★ {ratingText(doc.rating)} ({doc.rating.count}) · ↓ {doc.downloadCount} lượt tải · {doc.viewCount} lượt xem
          </p>
        </div>

        <div className="flex gap-3">
          {user ? (
            <>
              {isPublic && (
                <button
                  onClick={() => favorite.mutate(!doc.isFavorite)}
                  disabled={favorite.isPending}
                  aria-pressed={doc.isFavorite}
                  className={`btn ${doc.isFavorite ? 'bg-mark' : ''}`}
                >
                  <span key={String(doc.isFavorite)} className="animate-pop">
                    {doc.isFavorite ? '♥' : '♡'}
                  </span>
                  {doc.isFavorite ? 'Đã lưu' : 'Lưu lại'}
                </button>
              )}
              <button onClick={() => download.mutate()} disabled={download.isPending} className="btn btn-ink disabled:opacity-60">
                {download.isPending ? 'Đang tải...' : 'Tải xuống'}
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-ink">
              Đăng nhập để tải xuống
            </Link>
          )}
        </div>
      </div>

      {notice && (
        <p role="alert" className="mt-4 animate-pop border-l-4 border-flame bg-sheet px-3 py-2 text-sm">
          {notice}
        </p>
      )}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Suspense fallback={<div className="panel shadow-hard min-h-[32rem]" />}>
          <PdfViewer docId={doc.id} />
        </Suspense>

        <div className="panel shadow-hard flex min-h-[32rem] flex-col lg:sticky lg:top-20">
          <div className="flex border-b-2 border-ink font-display text-sm font-bold">
            {TABS.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`flex-1 border-ink px-2 py-3 transition-colors not-last:border-r-2 ${tab === item ? 'bg-ink text-paper' : 'hover:bg-mark'}`}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === 'Thông tin' && (
            <div className="flex-1 space-y-5 p-5">
              <p className="text-sm whitespace-pre-line">{doc.description ?? <span className="text-muted">Người đăng chưa viết mô tả.</span>}</p>

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t-2 border-ink pt-4 font-mono text-xs">
                <dt className="text-muted">NGƯỜI ĐĂNG</dt>
                <dd>{doc.uploader.name}</dd>
                <dt className="text-muted">NGÀY ĐĂNG</dt>
                <dd>{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</dd>
                <dt className="text-muted">DUNG LƯỢNG</dt>
                <dd>{fileSize(doc.fileSize)}</dd>
                {doc.major && (
                  <>
                    <dt className="text-muted">NGÀNH</dt>
                    <dd>{doc.major}</dd>
                  </>
                )}
              </dl>

              {isPublic && (
                <div className="border-t-2 border-ink pt-4">
                  <p className="font-display font-bold">Đánh giá của bạn</p>
                  {!user ? (
                    <p className="mt-1 text-sm text-muted">
                      <Link to="/login" className="underline">
                        Đăng nhập
                      </Link>{' '}
                      để đánh giá tài liệu này.
                    </p>
                  ) : isMine ? (
                    <p className="mt-1 text-sm text-muted">Bạn là người đăng nên không tự đánh giá được.</p>
                  ) : (
                    <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onMouseEnter={() => setHover(score)}
                          onClick={() => rate.mutate(score)}
                          disabled={rate.isPending}
                          aria-label={`${score} sao`}
                          className={`grid size-9 place-items-center border-2 border-ink text-lg transition duration-150 hover:-translate-y-0.5 ${score <= stars ? 'bg-mark' : 'bg-sheet text-ink/30'}`}
                        >
                          ★
                        </button>
                      ))}
                      {doc.myRating && <span className="ml-2 font-mono text-xs text-muted">ĐÃ CHẤM {doc.myRating}/5</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'Hỏi đáp' && (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((message, i) => (
                  <p
                    key={i}
                    className={`w-fit max-w-[85%] animate-pop px-3 py-2 text-sm ${message.role === 'user' ? 'ml-auto bg-ink text-paper' : 'border-l-4 border-flame bg-paper'}`}
                  >
                    {message.text}
                  </p>
                ))}
              </div>
              <form onSubmit={send} className="flex border-t-2 border-ink">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hỏi về tài liệu này..."
                  className="min-w-0 flex-1 bg-sheet px-4 py-3 outline-none"
                />
                <button className="border-l-2 border-ink bg-flame px-5 font-display font-bold transition-colors hover:bg-ink hover:text-paper">
                  GỬI
                </button>
              </form>
            </>
          )}

          {(tab === 'Tóm tắt' || tab === 'Ôn tập') && (
            <div className="grid flex-1 place-items-center p-6 text-center text-muted">
              Chức năng "{tab}" sẽ có khi kết nối AI service.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
