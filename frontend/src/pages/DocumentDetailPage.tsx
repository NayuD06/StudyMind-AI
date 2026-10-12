import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { lazy, Suspense, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import Comments from '../components/Comments.tsx'
import ReportBox from '../components/ReportBox.tsx'
import { api, errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'
import { fetchFile, fileSize, ratingText, saveBlob, subjectCode, subjectName, type DocDetail } from '../lib/documents.ts'
import { locale, t } from '../lib/i18n.ts'

// pdf.js khá nặng nên chỉ tải khi mở trang chi tiết
const PdfViewer = lazy(() => import('../components/PdfViewer.tsx'))

type Message = { role: 'user' | 'assistant'; text: string }

// Tên tiếng Việt dùng làm mã của tab; lúc hiển thị mới dịch
const TABS = ['Thông tin', 'Hỏi đáp', 'Tóm tắt', 'Ôn tập']

const STATUS_NOTE = {
  PENDING: t('Tài liệu đang chờ quản trị viên duyệt. Hiện chỉ bạn xem được.'),
  REJECTED: t('Tài liệu đã bị từ chối và không hiện trong thư viện.'),
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
    { role: 'assistant', text: t('Hãy đặt câu hỏi về nội dung tài liệu này.') },
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
      { role: 'assistant', text: t('AI service chưa được kết nối nên chưa thể trả lời.') },
    ])
    setInput('')
  }

  if (detail.isError || Number.isNaN(id)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h1 className="font-display text-4xl font-bold">{t('Không tìm thấy tài liệu')}</h1>
        <p className="mt-3 text-muted">{detail.isError ? errorMessage(detail.error) : t('Đường dẫn không hợp lệ.')}</p>
        <Link to="/documents" className="btn mt-6">
          {t('← Về thư viện')}
        </Link>
      </div>
    )
  }

  const doc = detail.data
  if (!doc) return <p className="mx-auto max-w-6xl px-4 py-20 text-sm text-muted">{t('Đang tải dữ liệu...')}</p>

  const isPublic = doc.moderationStatus === 'APPROVED'
  const isMine = user?.id === doc.uploader.id
  const stars = hover || doc.myRating || 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/documents" className="link-wipe text-sm">
        {t('← Thư viện')}
      </Link>

      {!isPublic && (
        <p className="mt-4 border-l-4 border-flame bg-mark/40 px-3 py-2 text-sm">
          {STATUS_NOTE[doc.moderationStatus as keyof typeof STATUS_NOTE]}
          {doc.rejectReason && <b> {t('Lý do:')} {doc.rejectReason}</b>}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted">
            <span className="bg-ink px-1.5 py-0.5 font-mono text-xs text-paper">{subjectCode(doc)}</span>{' '}
            {[subjectName(doc), doc.school].filter(Boolean).join(' · ') || t('Chưa phân môn')}
          </p>
          <h1 className="mt-3 font-display text-3xl leading-tight font-bold sm:text-4xl">{doc.title}</h1>
          <p className="mt-2 text-sm text-muted">
            {t('{0} trang', doc.pageCount ?? '?')} · ★ {ratingText(doc.rating)} ({doc.rating.count}) · {t('{0} lượt tải', doc.downloadCount)} · {t('{0} lượt xem', doc.viewCount)}
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
                  {doc.isFavorite ? t('Đã lưu') : t('Lưu lại')}
                </button>
              )}
              <button onClick={() => download.mutate()} disabled={download.isPending} className="btn btn-ink disabled:opacity-60">
                {download.isPending ? t('Đang tải...') : t('Tải xuống')}
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-ink">
              {t('Đăng nhập để tải xuống')}
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
        <div className="min-w-0 space-y-6">
          <Suspense fallback={<div className="panel shadow-hard min-h-[32rem]" />}>
            <PdfViewer docId={doc.id} />
          </Suspense>
          <Comments docId={doc.id} canPost={isPublic} />
        </div>

        <div className="panel shadow-hard flex min-h-[32rem] flex-col lg:sticky lg:top-20">
          <div className="flex border-b-2 border-ink font-display text-sm font-bold">
            {TABS.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`flex-1 border-ink px-2 py-3 transition-colors not-last:border-r-2 ${tab === item ? 'bg-ink text-paper' : 'hover:bg-mark'}`}
              >
                {t(item)}
              </button>
            ))}
          </div>

          {tab === 'Thông tin' && (
            <div className="animate-pop flex-1 space-y-5 p-5">
              <p className="text-sm whitespace-pre-line">{doc.description ?? <span className="text-muted">{t('Người đăng chưa viết mô tả.')}</span>}</p>

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t-2 border-ink pt-4 text-sm">
                <dt className="text-muted">{t('Người đăng')}</dt>
                <dd>
                  <Link to={`/users/${doc.uploader.id}`} className="link-wipe">
                    {doc.uploader.name}
                  </Link>
                </dd>
                <dt className="text-muted">{t('Ngày đăng')}</dt>
                <dd>{new Date(doc.createdAt).toLocaleDateString(locale)}</dd>
                <dt className="text-muted">{t('Dung lượng')}</dt>
                <dd>{fileSize(doc.fileSize)}</dd>
                {doc.major && (
                  <>
                    <dt className="text-muted">{t('Ngành')}</dt>
                    <dd>{doc.major}</dd>
                  </>
                )}
              </dl>

              {isPublic && (
                <div className="border-t-2 border-ink pt-4">
                  <p className="font-display font-bold">{t('Đánh giá của bạn')}</p>
                  {!user ? (
                    <p className="mt-1 text-sm text-muted">
                      <Link to="/login" className="underline">
                        {t('Đăng nhập')}
                      </Link>{' '}
                      {t('để đánh giá tài liệu này.')}
                    </p>
                  ) : isMine ? (
                    <p className="mt-1 text-sm text-muted">{t('Bạn là người đăng nên không tự đánh giá được.')}</p>
                  ) : (
                    <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onMouseEnter={() => setHover(score)}
                          onClick={() => rate.mutate(score)}
                          disabled={rate.isPending}
                          aria-label={`${score} sao`}
                          className={`grid size-9 place-items-center border-2 border-ink text-lg transition-colors ${score <= stars ? 'bg-mark' : 'bg-sheet text-ink/30'}`}
                        >
                          ★
                        </button>
                      ))}
                      {doc.myRating && <span className="ml-2 text-sm text-muted">{t('Bạn đã chấm')} {doc.myRating}/5</span>}
                    </div>
                  )}
                </div>
              )}

              {isPublic && user && !isMine && (
                <div className="border-t-2 border-ink pt-4">
                  <ReportBox key={doc.id} docId={doc.id} />
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
                    className={`w-fit max-w-[85%] px-3 py-2 text-sm ${message.role === 'user' ? 'ml-auto bg-ink text-paper' : 'border-l-4 border-flame bg-paper'}`}
                  >
                    {message.text}
                  </p>
                ))}
              </div>
              <form onSubmit={send} className="flex border-t-2 border-ink">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('Hỏi về tài liệu này...')}
                  className="min-w-0 flex-1 bg-sheet px-4 py-3 outline-none"
                />
                <button className="border-l-2 border-ink bg-flame px-5 font-display font-bold transition-colors hover:bg-ink hover:text-paper">
                  {t('Gửi')}
                </button>
              </form>
            </>
          )}

          {(tab === 'Tóm tắt' || tab === 'Ôn tập') && (
            <div className="grid flex-1 place-items-center p-6 text-center text-muted">
              {t('Chức năng "{0}" sẽ có khi kết nối AI service.', t(tab))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
