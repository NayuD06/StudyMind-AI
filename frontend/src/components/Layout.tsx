import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth.tsx'
import NotificationBell from './NotificationBell.tsx'
import Prefs from './Prefs.tsx'
import ScrollFx from './ScrollFx.tsx'
import { t } from '../lib/i18n.ts'

const NAV = [
  { to: '/documents', label: t('Thư viện') },
  { to: '/upload', label: t('Đăng tài liệu') },
]

export default function Layout() {
  const { pathname } = useLocation()
  const { user, loading, logout } = useAuth()

  // Về đầu trang mỗi khi chuyển trang
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b-2 border-ink bg-paper">
        <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-7">
          <Link to="/" className="group flex items-center gap-2 font-display text-xl font-bold">
            <span className="grid size-7 place-items-center bg-ink text-sm text-mark transition-transform duration-300 group-hover:-rotate-12 dark:bg-mark dark:text-coal">S</span>
            <span className="hidden sm:inline">StudyMind</span>
            <span className="hidden bg-flame px-1.5 text-sm text-coal min-[420px]:inline">AI</span>
          </Link>

          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className="link-wipe text-[13px] font-medium whitespace-nowrap sm:text-base">
              {item.label}
            </NavLink>
          ))}
          {user && (
            <NavLink to="/me" className="link-wipe text-[13px] font-medium whitespace-nowrap sm:text-base">
              {t('Của tôi')}
            </NavLink>
          )}

          {/* Màn hình hẹp không đủ chỗ: hai nút này nằm ở chân trang */}
          <Prefs className="ml-auto hidden lg:flex" />
          {user ? (
            <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:ml-0">
              <NotificationBell userId={user.id} />
              <Link to="/account" title={t('Tài khoản')} className="link-wipe hidden max-w-28 truncate text-sm font-medium lg:inline xl:max-w-40">
                {user.name}
              </Link>
              <button onClick={logout} className="btn btn-sm whitespace-nowrap max-sm:px-2">
                <span className="sm:hidden">{t('Thoát')}</span>
                <span className="hidden sm:inline">{t('Đăng xuất')}</span>
              </button>
            </div>
          ) : (
            // Ẩn nút trong lúc đang khôi phục phiên để không nháy "Đăng nhập" rồi đổi
            <Link to="/login" className={`btn btn-sm ml-auto whitespace-nowrap lg:ml-0 ${loading ? 'invisible' : ''}`}>
              {t('Đăng nhập')}
            </Link>
          )}
        </nav>
        <ScrollFx />
      </header>

      <main key={pathname} className="page-in flex-1">
        <Outlet />
      </main>

      <footer className="surface-dark border-t-2 border-ink bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-6 text-sm">
          <p>
            <span className="font-display font-bold">StudyMind AI</span>
            <span className="text-paper/60"> · {t('Đồ án chia sẻ tài liệu học tập')}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link to="/documents" className="text-paper/80 hover:text-paper hover:underline">
              {t('Thư viện')}
            </Link>
            <Link to="/upload" className="text-paper/80 hover:text-paper hover:underline">
              {t('Đăng tài liệu')}
            </Link>
            <Prefs onDark />
          </div>
        </div>
      </footer>
    </div>
  )
}
