import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import PageHeader, { ErrorNote } from '../components/PageHeader.tsx'
import { api, errorMessage } from '../lib/api.ts'
import { locale, t } from '../lib/i18n.ts'
import { useCountUp } from '../lib/useCountUp.ts'

export type Stats = {
  users: number
  lockedUsers: number
  subjects: number
  downloads: number
  openReports: number
  documents: { pending: number; approved: number; rejected: number }
  uploads: Day[]
  signups: Day[]
  topDocuments: { id: number; title: string; downloadCount: number; viewCount: number }[]
  topUploaders: { id: number; name: string; email: string; documents: number; downloads: number }[]
}

type Day = { date: string; count: number }

function StatTile({ label, value, note, tone = '' }: { label: string; value: number; note: string; tone?: string }) {
  const shown = useCountUp(value)
  return (
    <div className={`panel tile px-5 py-4 ${tone}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 font-display text-4xl font-bold tabular-nums">{shown}</p>
      <p className="mt-1 text-sm opacity-70">{note}</p>
    </div>
  )
}

// Biểu đồ cột 7 ngày; cột cao nhất chiếm 80% chiều cao để còn chỗ cho con số phía trên
function DayChart({ title, days, bar }: { title: string; days: Day[]; bar: string }) {
  const peak = Math.max(1, ...days.map((day) => day.count))
  const total = days.reduce((sum, day) => sum + day.count, 0)

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted">{t('7 ngày gần nhất: {0}', total)}</p>
      </div>

      <div className="mt-6 flex h-48 items-end gap-2 border-b-2 border-ink sm:gap-4">
        {days.map((day, i) => (
          <div key={day.date} className="group flex h-full flex-1 flex-col justify-end">
            <p className="mb-1 text-center text-xs">{day.count}</p>
            <div
              className={`animate-grow origin-bottom border-2 border-b-0 border-ink transition-colors group-hover:bg-mark ${bar}`}
              style={{ height: `${Math.max((day.count / peak) * 80, 2)}%`, animationDelay: `${i * 60}ms` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-4">
        {days.map((day) => (
          <p key={day.date} className="flex-1 text-center text-xs text-muted">
            {new Date(day.date).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}
          </p>
        ))}
      </div>
    </section>
  )
}

type Row = { id: number; title: string; sub: string; value: number }

// Bảng xếp hạng: thanh nền dài theo tỉ lệ so với dòng đứng đầu
function Ranking({ title, unit, rows }: { title: string; unit: string; rows: Row[] }) {
  const peak = Math.max(1, ...rows.map((row) => row.value))

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted">{unit}</p>
      </div>
      {rows.length === 0 && <p className="mt-6 text-sm text-muted">{t('Chưa có tài liệu nào được duyệt.')}</p>}
      <ol className="mt-4">
        {rows.map((row, i) => (
          <li key={row.id} className="relative flex items-center gap-4 border-b border-ink/15 py-3 last:border-0">
            <span
              className="animate-grow-x absolute inset-y-1 left-0 origin-left bg-mark/50"
              style={{ width: `${(row.value / peak) * 100}%`, animationDelay: `${i * 70}ms` }}
            />
            <span className="relative w-5 text-sm text-muted">{i + 1}.</span>
            <div className="relative min-w-0 flex-1">
              <p className="truncate font-medium">{row.title}</p>
              <p className="truncate text-xs text-muted">{row.sub}</p>
            </div>
            <span className="relative font-display text-xl font-bold tabular-nums">{row.value}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function DashboardPage() {
  // Dùng chung cache với số "chờ duyệt" ở thanh bên
  const stats = useQuery({
    queryKey: ['stats'],
    queryFn: async () => (await api.get<Stats>('/admin/stats')).data,
  })
  const data = stats.data

  return (
    <>
      <PageHeader title={t('Tổng quan')} />
      {stats.isError && <ErrorNote message={errorMessage(stats.error)} />}

      {data && (
        <>
          <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label={t('Chờ duyệt')} value={data.documents.pending} note={t('tài liệu cần xem')} tone={data.documents.pending ? 'bg-mark' : ''} />
            <StatTile label={t('Đã duyệt')} value={data.documents.approved} note={t('{0} bị từ chối', data.documents.rejected)} />
            <StatTile label={t('Người dùng')} value={data.users} note={t('{0} đang bị khóa', data.lockedUsers)} />
            <StatTile label={t('Lượt tải')} value={data.downloads} note={t('{0} môn học', data.subjects)} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <DayChart title={t('Tài liệu đăng mới')} days={data.uploads} bar="bg-flame" />
            <DayChart title={t('Người dùng mới')} days={data.signups} bar="bg-ink" />
            <Ranking
              title={t('Tài liệu nổi bật')}
              unit={t('Lượt tải')}
              rows={data.topDocuments.map((doc) => ({ id: doc.id, title: doc.title, sub: t('{0} lượt xem', doc.viewCount), value: doc.downloadCount }))}
            />
            <Ranking
              title={t('Người đăng tích cực')}
              unit={t('Tài liệu đã duyệt')}
              rows={data.topUploaders.map((user) => ({ id: user.id, title: user.name, sub: `${user.email} · ${t('{0} lượt tải', user.downloads)}`, value: user.documents }))}
            />
          </div>

          {data.documents.pending > 0 && (
            <Link to="/moderation" className="btn btn-ink mt-8">
              {t('Duyệt {0} tài liệu đang chờ', data.documents.pending)}
            </Link>
          )}
        </>
      )}
    </>
  )
}
