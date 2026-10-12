import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'
import { t } from '../lib/i18n.ts'
import Prefs from '../components/Prefs.tsx'

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
      <div className="surface-dark hidden flex-col justify-between bg-ink p-12 text-paper lg:flex">
        <p className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid size-7 place-items-center bg-mark text-sm text-ink">S</span>
          StudyMind
          <span className="bg-flame px-1.5 text-xs text-ink">{t('Quản trị')}</span>
        </p>
        <div>
          <p className="font-display text-5xl leading-tight font-bold">{t('Trang quản trị')}</p>
          <p className="mt-4 max-w-sm text-paper/70">{t('Duyệt tài liệu, xử lý báo cáo, quản lý người dùng và môn học.')}</p>
        </div>
        <p className="text-sm text-paper/50">{t('Chỉ dành cho tài khoản quản trị viên.')}</p>
      </div>

      <div className="relative flex items-center justify-center px-4 py-16">
        <Prefs className="absolute top-4 right-4" />
        <form onSubmit={submit} className={`panel shadow-hard w-full max-w-sm space-y-5 p-8 ${loading ? 'invisible' : ''}`}>
          <h1 className="font-display text-3xl font-bold">{t('Đăng nhập')}</h1>

          <label className="block">
            <span className="mb-1 block font-display font-bold">Email</span>
            <input name="email" type="email" required autoComplete="username" className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block font-display font-bold">{t('Mật khẩu')}</span>
            <input name="password" type="password" required autoComplete="current-password" className="field" />
          </label>

          {error && (
            <p role="alert" className="border-l-4 border-flame bg-paper px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <button disabled={busy} className="btn btn-ink w-full">
            {busy ? t('Đang kiểm tra...') : t('Đăng nhập')}
          </button>
        </form>
      </div>
    </div>
  )
}
