import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth.tsx'
import NotificationBell from './NotificationBell.tsx'
import Prefs from './Prefs.tsx'
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
      <header className="sticky top-0 z-20 border-b-2 border-ink bg-paper/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-8">
          <Link to="/" className="group flex items-center gap-2 font-display text-xl font-bold">
            <span className="grid size-7 place-items-center bg-ink text-sm text-mark transition-transform dark:bg-mark dark:text-coal duration-300 group-hover:rotate-90">
              S
            </span>
            <span className="hidden sm:inline">STUDYMIND</span>
            <span className="hidden bg-flame px-1.5 text-sm min-[420px]:inline">AI</span>
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
              <Link to="/account" title={t('Tài khoản')} className="link-wipe hidden max-w-40 truncate font-mono text-xs sm:inline lg:max-w-28 xl:max-w-40">
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
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="surface-dark overflow-hidden border-t-2 border-ink bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-6">
          <p className="text-outline font-display text-[13vw] leading-none font-bold whitespace-nowrap lg:text-[9rem]">
            STUDYMIND AI
          </p>
          <Prefs onDark className="mt-6" />
          <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-paper/30 pt-4 font-mono text-xs text-paper/70">
            <span>{t('Đồ án: chia sẻ tài liệu học tập + tìm kiếm ngữ nghĩa + RAG')}</span>
            <span>React · Node.js · MySQL · FastAPI · Qdrant</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
