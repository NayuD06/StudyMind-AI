import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'

export default function LoginPage() {
  const { user, loading, login } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await login({ email: String(form.get('email')), password: String(form.get('password')) })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (user) return <Navigate to="/" replace />

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink p-12 text-paper lg:flex">
        <p className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid size-7 place-items-center bg-mark text-sm text-ink">S</span>
          STUDYMIND
          <span className="bg-flame px-1.5 text-xs text-ink">ADMIN</span>
        </p>
        <div className="font-display text-6xl leading-[1.05] font-bold">
          <p className="overflow-hidden">
            <span className="block animate-rise">Khu vực</span>
          </p>
          <p className="overflow-hidden">
            <span className="block animate-rise text-mark [animation-delay:120ms]">quản trị</span>
          </p>
          <p className="mt-6 font-mono text-sm font-normal text-paper/60">
            Duyệt tài liệu · quản lý người dùng · môn học
            <span className="ml-1 inline-block h-4 w-2 animate-blink bg-flame align-middle" />
          </p>
        </div>
        <p className="font-mono text-xs text-paper/50">Chỉ dành cho tài khoản quản trị viên.</p>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        <form onSubmit={submit} className={`panel shadow-hard w-full max-w-sm animate-pop space-y-5 p-8 ${loading ? 'invisible' : ''}`}>
          <div>
            <p className="font-mono text-xs text-muted">/ ĐĂNG NHẬP</p>
            <h1 className="mt-1 font-display text-3xl font-bold">Quản trị viên</h1>
          </div>

          <label className="block">
            <span className="mb-1 block font-display font-bold">Email</span>
            <input name="email" type="email" required autoComplete="username" className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block font-display font-bold">Mật khẩu</span>
            <input name="password" type="password" required autoComplete="current-password" className="field" />
          </label>

          {error && (
            <p role="alert" className="animate-pop border-l-4 border-flame bg-paper px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <button disabled={busy} className="btn btn-ink w-full">
            {busy ? 'Đang kiểm tra...' : 'Đăng nhập →'}
          </button>
        </form>
      </div>
    </div>
  )
}
