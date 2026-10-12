import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import PageHeader, { ErrorNote } from '../components/PageHeader.tsx'
import { api, errorMessage } from '../lib/api.ts'
import { locale, t } from '../lib/i18n.ts'

type Status = 'PENDING' | 'APPROVED' | 'REJECTED'

type ModerationItem = {
  id: number
  title: string
  description: string | null
  fileName: string
  fileSize: number
  pageCount: number | null
  createdAt: string
  rejectReason: string | null
  uploader: { name: string }
  subjects: { subject: { id: number; name: string } }[]
  piiFindings: { type: 'email' | 'phone'; page: number; sample: string }[] | null
}

const TABS: { status: Status; label: string }[] = [
  { status: 'PENDING', label: t('Chờ duyệt') },
  { status: 'APPROVED', label: t('Đã duyệt') },
  { status: 'REJECTED', label: t('Bị từ chối') },
]

const fileSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

export default function ModerationPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>('PENDING')
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [previewError, setPreviewError] = useState('')

  const documents = useQuery({
    queryKey: ['admin-documents', status],
    queryFn: async () => (await api.get<{ items: ModerationItem[] }>('/admin/documents', { params: { status } })).data.items,
  })

  const refresh = () => {
    setRejectingId(null)
    queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
  }

  const moderate = useMutation({
    mutationFn: (input: { id: number; status: 'APPROVED' | 'REJECTED'; reason?: string }) =>
      api.patch(`/admin/documents/${input.id}/moderation`, { status: input.status, reason: input.reason }),
    onSuccess: refresh,
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/documents/${id}`),
    onSuccess: refresh,
  })

  // Tải PDF kèm token rồi mở bằng blob, vì tài liệu chưa duyệt không mở thẳng bằng link được
  async function preview(id: number) {
    setPreviewError('')
    // Mở tab ngay trong lúc bấm để trình duyệt không chặn popup, có file rồi mới gán địa chỉ
    const tab = window.open('', '_blank')
    try {
      const { data } = await api.get(`/documents/${id}/file`, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      if (tab) tab.location.href = url
      else window.location.assign(url)
    } catch (err) {
      tab?.close()
      setPreviewError(errorMessage(err))
    }
  }

  function reject(e: FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault()
    const reason = String(new FormData(e.currentTarget).get('reason')).trim()
    if (reason) moderate.mutate({ id, status: 'REJECTED', reason })
  }

  const busy = moderate.isPending || remove.isPending
  const error = previewError || (moderate.isError && errorMessage(moderate.error)) || (remove.isError && errorMessage(remove.error))

  return (
    <>
      <PageHeader title={t('Kiểm duyệt tài liệu')}>
        <div className="flex border-2 border-ink font-display text-sm font-bold">
          {TABS.map((tab) => (
            <button
              key={tab.status}
              onClick={() => {
                setStatus(tab.status)
                setRejectingId(null)
              }}
              className={`border-ink px-4 py-2.5 transition-colors not-last:border-r-2 ${status === tab.status ? 'bg-ink text-paper' : 'bg-sheet hover:bg-mark'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </PageHeader>

      {error && <ErrorNote message={error} />}
      {documents.isError && <ErrorNote message={errorMessage(documents.error)} />}

      <div className="space-y-4">
        {documents.data?.length === 0 && (
          <div className="panel px-6 py-14 text-center text-muted">{t('Không có tài liệu nào ở mục này.')}</div>
        )}

        {documents.data?.map((doc) => (
          <article key={doc.id} className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold">{doc.title}</h2>
                <p className="mt-1 font-mono text-xs break-all text-muted">
                  {doc.fileName} · {t('{0} trang', doc.pageCount ?? '?')} · {fileSize(doc.fileSize)} · {doc.uploader.name} ·{' '}
                  {new Date(doc.createdAt).toLocaleDateString(locale)}
                </p>
                {doc.subjects.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-2">
                    {doc.subjects.map(({ subject }) => (
                      <span key={subject.id} className="tag">
                        {subject.name}
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => preview(doc.id)} className="btn btn-sm">
                  {t('Xem PDF')}
                </button>
                {status !== 'APPROVED' && (
                  <button disabled={busy} onClick={() => moderate.mutate({ id: doc.id, status: 'APPROVED' })} className="btn btn-sm btn-ink">
                    {t('Duyệt')}
                  </button>
                )}
                {status !== 'REJECTED' && (
                  <button disabled={busy} onClick={() => setRejectingId(rejectingId === doc.id ? null : doc.id)} className="btn btn-sm btn-flame">
                    {t('Từ chối')}
                  </button>
                )}
                {status === 'REJECTED' && (
                  <button
                    disabled={busy}
                    onClick={() => window.confirm(t('Xóa hẳn "{0}"? Không khôi phục được.', doc.title)) && remove.mutate(doc.id)}
                    className="btn btn-sm btn-flame"
                  >
                    {t('Xóa')}
                  </button>
                )}
              </div>
            </div>

            {doc.description && <p className="mt-3 text-sm">{doc.description}</p>}
            {doc.rejectReason && <p className="mt-3 text-sm">{t('Lý do từ chối:')} {doc.rejectReason}</p>}

            {doc.piiFindings && doc.piiFindings.length > 0 && (
              <div className="mt-4 border-l-4 border-flame bg-mark/40 px-3 py-2">
                <p className="font-display text-sm font-bold">{t('Có thể chứa thông tin cá nhân')}</p>
                <p className="mt-1 font-mono text-xs">
                  {doc.piiFindings.map((finding) => `${finding.sample} (tr. ${finding.page})`).join(' · ')}
                </p>
              </div>
            )}

            {rejectingId === doc.id && (
              <form onSubmit={(e) => reject(e, doc.id)} className="mt-4 flex flex-wrap gap-3 border-t-2 border-dashed border-ink pt-4">
                <input name="reason" required maxLength={500} autoFocus placeholder={t('Lý do từ chối (người đăng sẽ thấy)')} className="field min-w-0 flex-1" />
                <button disabled={busy} className="btn btn-flame">
                  {t('Xác nhận từ chối')}
                </button>
              </form>
            )}
          </article>
        ))}
      </div>
    </>
  )
}
