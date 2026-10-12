import { useQuery } from '@tanstack/react-query'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { api } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'
import type { Stats } from '../pages/DashboardPage.tsx'
import Prefs from './Prefs.tsx'
import { t } from '../lib/i18n.ts'

const NAV = [
  { to: '/', label: t('Tổng quan') },
  { to: '/moderation', label: t('Kiểm duyệt') },
  { to: '/reports', label: t('Báo cáo') },
  { to: '/users', label: t('Người dùng') },
  { to: '/subjects', label: t('Môn học') },
  { to: '/logs', label: t('Nhật ký') },
  { to: '/account', label: t('Tài khoản') },
]

export default function Layout() {
  const { user, loading, logout } = useAuth()
  const { pathname } = useLocation()

  const stats = useQuery({
    queryKey: ['stats'],
    queryFn: async () => (await api.get<Stats>('/admin/stats')).data,
    enabled: !!user,
  })
  // Số việc đang chờ xử lý, hiện cạnh mục tương ứng trên menu
  const badges: Record<string, number> = {
    '/moderation': stats.data?.documents.pending ?? 0,
    '/reports': stats.data?.openReports ?? 0,
  }

  if (loading) return null
  // Chỉ là điều hướng cho tiện; quyền thật sự do server kiểm tra ở mọi API /admin
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen md:grid md:grid-cols-[15rem_1fr]">
      <aside className="surface-dark flex flex-col border-b-2 border-ink bg-ink text-paper md:sticky md:top-0 md:h-screen md:border-r-2 md:border-b-0">
        <div className="flex items-center gap-2 px-5 py-5 font-display text-lg font-bold">
          <span className="grid size-7 place-items-center bg-mark text-sm text-ink">S</span>
          StudyMind
          <span className="bg-flame px-1.5 text-xs text-ink">{t('Quản trị')}</span>
        </div>

        <nav className="flex overflow-x-auto border-y border-paper/20 md:block md:py-3">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-item">
              {item.label}
              {badges[item.to] > 0 && <span className="bg-mark px-1.5 text-xs text-ink">{badges[item.to]}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:mt-auto md:block">
          <Prefs onDark className="order-last md:mb-4" />
          <div className="min-w-0">
            <p className="truncate font-display font-bold">{user.name}</p>
            <p className="truncate text-xs text-paper/60">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="shrink-0 border-2 border-paper px-3 py-1.5 font-display text-sm font-bold transition-colors hover:bg-flame hover:text-ink md:mt-4 md:w-full"
          >
            {t('Đăng xuất')}
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-8 md:px-10 md:py-10">
        <div key={pathname} className="page-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
