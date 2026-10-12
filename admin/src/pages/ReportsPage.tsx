import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import PageHeader, { ErrorNote } from '../components/PageHeader.tsx'
import { api, errorMessage } from '../lib/api.ts'
import { locale, t } from '../lib/i18n.ts'

type Status = 'OPEN' | 'RESOLVED' | 'REJECTED'

type ReportItem = {
  id: number
  reason: string
  createdAt: string
  user: { name: string; email: string }
  document: { id: number; title: string; moderationStatus: string; uploader: { name: string; email: string } }
}

const TABS: { status: Status; label: string }[] = [
  { status: 'OPEN', label: t('Chờ xử lý') },
  { status: 'RESOLVED', label: t('Đã gỡ') },
  { status: 'REJECTED', label: t('Đã bỏ qua') },
]

export default function ReportsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>('OPEN')
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [previewError, setPreviewError] = useState('')

  const reports = useQuery({
    queryKey: ['admin-reports', status],
    queryFn: async () => (await api.get<{ items: ReportItem[] }>('/admin/reports', { params: { status } })).data.items,
  })

  const resolve = useMutation({
    mutationFn: (input: { id: number; action: 'REMOVE' | 'DISMISS'; reason?: string }) =>
      api.patch(`/admin/reports/${input.id}`, { action: input.action, reason: input.reason }),
    onSuccess: () => {
      setRemovingId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  // Tải PDF kèm token rồi mở bằng blob (giống trang Kiểm duyệt)
  async function preview(id: number) {
    setPreviewError('')
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

  function remove(e: FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault()
    const reason = String(new FormData(e.currentTarget).get('reason')).trim()
    if (reason) resolve.mutate({ id, action: 'REMOVE', reason })
  }

  const error = previewError || (resolve.isError && errorMessage(resolve.error))

  return (
    <>
      <PageHeader title={t('Báo cáo vi phạm')}>
        <div className="flex border-2 border-ink font-display text-sm font-bold">
          {TABS.map((tab) => (
            <button
              key={tab.status}
              onClick={() => {
                setStatus(tab.status)
                setRemovingId(null)
              }}
              className={`border-ink px-4 py-2.5 transition-colors not-last:border-r-2 ${status === tab.status ? 'bg-ink text-paper' : 'bg-sheet hover:bg-mark'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </PageHeader>

      {error && <ErrorNote message={error} />}
      {reports.isError && <ErrorNote message={errorMessage(reports.error)} />}

      <div className="space-y-4">
        {reports.data?.length === 0 && <div className="panel px-6 py-14 text-center text-muted">{t('Không có báo cáo nào ở mục này.')}</div>}

        {reports.data?.map((report) => (
          <article key={report.id} className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold">{report.document.title}</h2>
                <p className="mt-1 font-mono text-xs break-all text-muted">
                  {t('Người đăng:')} {report.document.uploader.name} ({report.document.uploader.email})
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => preview(report.document.id)} className="btn btn-sm">
                  {t('Xem PDF')}
                </button>
                {status === 'OPEN' && (
                  <>
                    <button disabled={resolve.isPending} onClick={() => resolve.mutate({ id: report.id, action: 'DISMISS' })} className="btn btn-sm">
                      {t('Bỏ qua')}
                    </button>
                    <button
                      disabled={resolve.isPending}
                      onClick={() => setRemovingId(removingId === report.id ? null : report.id)}
                      className="btn btn-sm btn-flame"
                    >
                      {t('Gỡ tài liệu')}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 border-l-4 border-flame bg-mark/40 px-3 py-2">
              <p className="text-sm break-words whitespace-pre-line">{report.reason}</p>
              <p className="mt-1 font-mono text-xs text-muted">
                {report.user.name} ({report.user.email}) · {new Date(report.createdAt).toLocaleString(locale)}
              </p>
            </div>

            {removingId === report.id && (
              <form onSubmit={(e) => remove(e, report.id)} className="mt-4 flex flex-wrap gap-3 border-t-2 border-dashed border-ink pt-4">
                <input
                  name="reason"
                  required
                  maxLength={500}
                  autoFocus
                  defaultValue={report.reason.slice(0, 500)}
                  aria-label={t('Lý do gỡ tài liệu')}
                  placeholder={t('Lý do gỡ (người đăng sẽ thấy)')}
                  className="field min-w-0 flex-1"
                />
                <button disabled={resolve.isPending} className="btn btn-flame">
                  {t('Xác nhận gỡ')}
                </button>
              </form>
            )}
          </article>
        ))}
      </div>
    </>
  )
}
