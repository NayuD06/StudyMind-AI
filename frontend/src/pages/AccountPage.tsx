import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'

export default function AccountPage() {
  const { user, loading, changePassword, logoutAll } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const el = e.currentTarget
    const form = new FormData(el)
    const newPassword = String(form.get('newPassword'))
    setDone(false)
    if (newPassword !== form.get('confirm')) return setError('Hai lần nhập mật khẩu mới không khớp')

    setBusy(true)
    setError('')
    try {
      await changePassword({ currentPassword: String(form.get('currentPassword')), newPassword })
      el.reset()
      setDone(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function signOutEverywhere() {
    setError('')
    try {
      await logoutAll()
      navigate('/login')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-4xl font-bold">Cần đăng nhập để xem tài khoản</h1>
        <Link to="/login" className="btn btn-ink mt-6">
          Đăng nhập →
        </Link>
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-mono text-xs text-muted">/ TÀI KHOẢN</p>
      <h1 className="mt-2 overflow-hidden pb-1 font-display text-5xl font-bold">
        <span className="block animate-rise">{user.name}</span>
      </h1>
      <p className="mt-2 font-mono text-xs text-muted">{user.email}</p>

      {error && (
        <p role="alert" className="mt-6 animate-pop border-l-4 border-flame bg-sheet px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="mt-6 animate-pop border-l-4 border-ink bg-mark/40 px-3 py-2 text-sm">
          Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.
        </p>
      )}

      <form onSubmit={submit} className="panel shadow-hard mt-8 space-y-5 p-6">
        <h2 className="font-display text-2xl font-bold">Đổi mật khẩu</h2>
        <label className="block">
          <span className="mb-1 block font-display font-bold">Mật khẩu hiện tại</span>
          <input name="currentPassword" type="password" required maxLength={64} autoComplete="current-password" className="field" />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-display font-bold">Mật khẩu mới</span>
            <input name="newPassword" type="password" required minLength={8} maxLength={64} autoComplete="new-password" className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block font-display font-bold">Nhập lại mật khẩu mới</span>
            <input name="confirm" type="password" required minLength={8} maxLength={64} autoComplete="new-password" className="field" />
          </label>
        </div>
        <button disabled={busy} className="btn btn-ink disabled:opacity-60">
          {busy ? 'Đang đổi...' : 'Đổi mật khẩu'}
        </button>
      </form>

      <div className="panel mt-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="max-w-md">
          <h2 className="font-display text-2xl font-bold">Đăng xuất mọi thiết bị</h2>
          <p className="mt-1 text-sm text-muted">Dùng khi bạn quên đăng xuất ở máy lạ. Thiết bị này cũng sẽ bị đăng xuất.</p>
        </div>
        <button onClick={signOutEverywhere} className="btn btn-flame">
          Đăng xuất tất cả
        </button>
      </div>
    </div>
  )
}
