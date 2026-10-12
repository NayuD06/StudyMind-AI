import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth.tsx'
import NotificationBell from './NotificationBell.tsx'

const NAV = [
  { to: '/documents', label: 'Thư viện' },
  { to: '/upload', label: 'Đăng tài liệu' },
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
        <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-8">
          <Link to="/" className="group flex items-center gap-2 font-display text-xl font-bold">
            <span className="grid size-7 place-items-center bg-ink text-sm text-mark transition-transform duration-300 group-hover:rotate-90">
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
              Của tôi
            </NavLink>
          )}

          {user ? (
            <div className="ml-auto flex items-center gap-3">
              <NotificationBell userId={user.id} />
              <Link to="/account" title="Tài khoản" className="link-wipe hidden max-w-40 truncate font-mono text-xs sm:inline">
                {user.name}
              </Link>
              <button onClick={logout} className="btn btn-sm whitespace-nowrap">
                <span className="sm:hidden">Thoát</span>
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          ) : (
            // Ẩn nút trong lúc đang khôi phục phiên để không nháy "Đăng nhập" rồi đổi
            <Link to="/login" className={`btn btn-sm ml-auto whitespace-nowrap ${loading ? 'invisible' : ''}`}>
              Đăng nhập
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="overflow-hidden border-t-2 border-ink bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-6">
          <p className="text-outline font-display text-[13vw] leading-none font-bold whitespace-nowrap lg:text-[9rem]">
            STUDYMIND AI
          </p>
          <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-paper/30 pt-4 font-mono text-xs text-paper/70">
            <span>Đồ án: chia sẻ tài liệu học tập + tìm kiếm ngữ nghĩa + RAG</span>
            <span>React · Node.js · MySQL · FastAPI · Qdrant</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
