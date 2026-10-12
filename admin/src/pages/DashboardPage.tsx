import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import PageHeader, { ErrorNote } from '../components/PageHeader.tsx'
import { api, errorMessage } from '../lib/api.ts'
import { useCountUp } from '../lib/useCountUp.ts'
import { locale, t } from '../lib/i18n.ts'

export type Stats = {
  users: number
  lockedUsers: number
  subjects: number
  downloads: number
  openReports: number
  documents: { pending: number; approved: number; rejected: number }
  uploads: { date: string; count: number }[]
}

function StatTile({ label, value, note, tone, delay }: { label: string; value: number; note: string; tone: string; delay: number }) {
  const shown = useCountUp(value)
  return (
    <div
      className={`panel animate-pop p-5 transition duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-ink)] ${tone}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="font-mono text-xs">{label}</p>
      <p className="mt-3 font-display text-5xl font-bold tabular-nums">{shown}</p>
      <p className="mt-2 text-sm opacity-70">{note}</p>
    </div>
  )
}

export default function DashboardPage() {
  // Dùng chung cache với số "chờ duyệt" ở thanh bên
  const stats = useQuery({
    queryKey: ['stats'],
    queryFn: async () => (await api.get<Stats>('/admin/stats')).data,
  })
  const data = stats.data
  const peak = Math.max(1, ...(data?.uploads.map((day) => day.count) ?? []))

  return (
    <>
      <PageHeader code={t('01 · TỔNG QUAN')} title={t('Bảng điều khiển')} />
      {stats.isError && <ErrorNote message={errorMessage(stats.error)} />}

      {data && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label={t('CHỜ DUYỆT')} value={data.documents.pending} note={t('tài liệu cần xem')} tone={data.documents.pending ? 'bg-mark' : ''} delay={0} />
            <StatTile label={t('ĐÃ DUYỆT')} value={data.documents.approved} note={t('{0} bị từ chối', data.documents.rejected)} tone="" delay={70} />
            <StatTile label={t('NGƯỜI DÙNG')} value={data.users} note={t('{0} đang bị khóa', data.lockedUsers)} tone="" delay={140} />
            <StatTile label={t('LƯỢT TẢI')} value={data.downloads} note={t('{0} môn học', data.subjects)} tone="bg-ink text-paper" delay={210} />
          </div>

          <section className="panel mt-8 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-bold">{t('Tài liệu đăng mới')}</h2>
              <p className="font-mono text-xs text-muted">{t('7 NGÀY GẦN NHẤT')}</p>
            </div>

            <div className="mt-6 flex h-48 items-end gap-2 border-b-2 border-ink sm:gap-4">
              {data.uploads.map((day, i) => (
                <div key={day.date} className="group flex h-full flex-1 flex-col justify-end">
                  <p className="mb-1 text-center font-mono text-xs">{day.count}</p>
                  <div
                    className="animate-grow origin-bottom border-2 border-b-0 border-ink bg-flame transition-colors group-hover:bg-mark"
                    style={{ height: `${Math.max((day.count / peak) * 80, 2)}%`, animationDelay: `${i * 60}ms` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2 sm:gap-4">
              {data.uploads.map((day) => (
                <p key={day.date} className="flex-1 text-center font-mono text-xs text-muted">
                  {new Date(day.date).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}
                </p>
              ))}
            </div>
          </section>

          {data.documents.pending > 0 && (
            <Link to="/moderation" className="btn btn-ink mt-8">
              {t('Duyệt {0} tài liệu đang chờ →', data.documents.pending)}
            </Link>
          )}
        </>
      )}
    </>
  )
}
