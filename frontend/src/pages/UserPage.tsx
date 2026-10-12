import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DocCard from '../components/DocCard.tsx'
import { api, errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'
import { fetchDocuments } from '../lib/documents.ts'
import { locale, t } from '../lib/i18n.ts'

type PublicUser = {
  id: number
  name: string
  school: string | null
  major: string | null
  createdAt: string
  documentCount: number
  downloadCount: number
}

// Trang công khai của một người đăng: thông tin cơ bản và các tài liệu đã được duyệt
export default function UserPage() {
  const id = Number(useParams().id)
  const { user: me } = useAuth()
  const [page, setPage] = useState(1)

  const profile = useQuery({
    queryKey: ['user', id],
    queryFn: async () => (await api.get<{ user: PublicUser }>(`/users/${id}`)).data.user,
  })
  const documents = useQuery({
    queryKey: ['documents', 'by-user', id, page],
    queryFn: () => fetchDocuments({ uploaderId: id, page }),
    placeholderData: keepPreviousData,
    enabled: profile.isSuccess,
  })

  if (profile.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-4xl font-bold">{errorMessage(profile.error)}</h1>
        <Link to="/documents" className="btn btn-ink mt-6">
          {t('← Về thư viện')}
        </Link>
      </div>
    )
  }
  const user = profile.data
  if (!user) return <p className="mx-auto max-w-6xl px-4 py-20 text-sm text-muted">{t('Đang tải dữ liệu...')}</p>

  const data = documents.data
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1
  const stats = [
    [t('Tài liệu'), user.documentCount],
    [t('Lượt tải'), user.downloadCount],
    [t('Tham gia'), new Date(user.createdAt).toLocaleDateString(locale, { month: '2-digit', year: 'numeric' })],
  ] as const

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{user.name}</h1>
        {me?.id === user.id && (
          <Link to="/account" className="text-sm underline underline-offset-4">
            {t('Sửa hồ sơ')}
          </Link>
        )}
      </div>
      <p className="mt-2 text-muted">{[user.school, user.major].filter(Boolean).join(' · ') || t('Chưa cập nhật trường và ngành')}</p>

      <dl className="panel mt-6 grid w-fit grid-cols-3 divide-x-2 divide-ink">
        {stats.map(([label, value]) => (
          <div key={label} className="px-5 py-3">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="font-display text-2xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      {data && data.items.length > 0 && (
        <div className={`mt-10 stagger grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-4 ${documents.isPlaceholderData ? 'opacity-50' : ''}`}>
          {data.items.map((doc) => (
            <DocCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
      {data && data.items.length === 0 && (
        <div className="panel mt-10 px-6 py-14 text-center">
          <p className="font-display text-2xl font-bold">{t('Người này chưa có tài liệu nào trong thư viện')}</p>
        </div>
      )}

      {data && pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm disabled:opacity-40">
            {t('← Trước')}
          </button>
          <span className="text-sm">
            {t('Trang')} {page}/{pages}
          </span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="btn btn-sm disabled:opacity-40">
            {t('Sau →')}
          </button>
        </div>
      )}
    </div>
  )
}
