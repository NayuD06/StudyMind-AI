import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import DocCard from '../components/DocCard.tsx'
import { api, errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'
import { fileSize, subjectName, type DocSummary } from '../lib/documents.ts'
import { locale, t } from '../lib/i18n.ts'

const STATUS = {
  PENDING: { label: t('CHỜ DUYỆT'), tone: 'bg-mark' },
  APPROVED: { label: t('ĐÃ DUYỆT'), tone: 'bg-ink text-paper' },
  REJECTED: { label: t('BỊ TỪ CHỐI'), tone: 'bg-flame' },
}

type Tab = 'mine' | 'favorites'

export default function MyDocumentsPage() {
  const { user, loading } = useAuth()
  const client = useQueryClient()
  const [tab, setTab] = useState<Tab>('mine')
  const [confirming, setConfirming] = useState<number | null>(null)

  const mine = useQuery({
    queryKey: ['my-documents', user?.id],
    queryFn: async () => (await api.get<{ items: DocSummary[] }>('/documents/mine')).data.items,
    enabled: !!user,
  })
  const favorites = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => (await api.get<{ items: DocSummary[] }>('/documents/favorites')).data.items,
    enabled: !!user,
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      setConfirming(null)
      client.invalidateQueries({ queryKey: ['my-documents'] })
      client.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-4xl font-bold">{t('Cần đăng nhập để xem tài liệu của bạn')}</h1>
        <Link to="/login" className="btn btn-ink mt-6">
          {t('Đăng nhập →')}
        </Link>
      </div>
    )
  }

  const active = tab === 'mine' ? mine : favorites

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="flex justify-between font-mono text-xs text-muted">
        <span>{t('/ CỦA TÔI')}</span>
        <Link to="/account" className="link-wipe text-ink">
          {t('TÀI KHOẢN & MẬT KHẨU →')}
        </Link>
      </p>
      <h1 className="mt-2 overflow-hidden pb-1 font-display text-5xl font-bold">
        <span className="block animate-rise">{t('Tài liệu của tôi')}</span>
      </h1>

      <div className="mt-8 flex w-fit border-2 border-ink font-display text-sm font-bold">
        {(
          [
            ['mine', t('ĐÃ ĐĂNG'), mine.data?.length],
            ['favorites', t('ĐÃ LƯU'), favorites.data?.length],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-5 py-3 transition-colors not-last:border-r-2 not-last:border-ink ${tab === value ? 'bg-ink text-paper' : 'bg-sheet hover:bg-mark'}`}
          >
            {label} {count !== undefined && <span className="font-mono font-normal opacity-60">{count}</span>}
          </button>
        ))}
      </div>

      {active.isError && (
        <p role="alert" className="mt-6 border-l-4 border-flame bg-sheet px-3 py-2 text-sm">
          {errorMessage(active.error)}
        </p>
      )}
      {remove.isError && (
        <p role="alert" className="mt-6 border-l-4 border-flame bg-sheet px-3 py-2 text-sm">
          {errorMessage(remove.error)}
        </p>
      )}

      {tab === 'mine' && mine.data && (
        <div className="mt-6 space-y-4">
          {mine.data.map((doc) => {
            const status = STATUS[doc.moderationStatus]
            return (
              <div key={doc.id} className="panel animate-pop flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
                <div className="min-w-0 flex-1 basis-64">
                  <p className="font-mono text-xs">
                    <span className={`border-2 border-ink px-1.5 py-0.5 ${status.tone}`}>{status.label}</span>
                    <span className="ml-3 text-muted">
                      {new Date(doc.createdAt).toLocaleDateString(locale)} · {fileSize(doc.fileSize)}
                    </span>
                  </p>
                  <Link to={`/documents/${doc.id}`} className="mt-2 block truncate font-display text-xl font-bold hover:underline">
                    {doc.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {subjectName(doc) ?? t('Chưa phân môn')} · {t('{0} trang', doc.pageCount ?? '?')} · ↓ {doc.downloadCount}
                  </p>
                  {doc.rejectReason && <p className="mt-2 border-l-4 border-flame pl-3 text-sm">{t('Lý do từ chối:')} {doc.rejectReason}</p>}
                </div>

                {confirming === doc.id ? (
                  <div className="flex animate-pop items-center gap-2">
                    <span className="font-mono text-xs">{t('XÓA HẲN?')}</span>
                    <button onClick={() => remove.mutate(doc.id)} disabled={remove.isPending} className="btn btn-sm btn-flame">
                      {t('Xóa')}
                    </button>
                    <button onClick={() => setConfirming(null)} className="btn btn-sm">
                      {t('Thôi')}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirming(doc.id)} className="btn btn-sm">
                    {t('Xóa')}
                  </button>
                )}
              </div>
            )
          })}
          {mine.data.length === 0 && (
            <div className="panel px-6 py-14 text-center">
              <p className="font-display text-2xl font-bold">{t('Bạn chưa đăng tài liệu nào')}</p>
              <Link to="/upload" className="btn btn-flame mt-6">
                {t('Đăng tài liệu →')}
              </Link>
            </div>
          )}
        </div>
      )}

      {tab === 'favorites' && favorites.data && (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.data.map((doc) => (
              <DocCard key={doc.id} doc={doc} />
            ))}
          </div>
          {favorites.data.length === 0 && (
            <div className="panel px-6 py-14 text-center">
              <p className="font-display text-2xl font-bold">{t('Chưa lưu tài liệu nào')}</p>
              <p className="mt-2 text-muted">{t('Bấm "Lưu lại" ở trang tài liệu để xem lại sau.')}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
