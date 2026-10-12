import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell.tsx'
import { errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'
import { t } from '../lib/i18n.ts'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await register({
        name: String(form.get('name')),
        email: String(form.get('email')),
        password: String(form.get('password')),
      })
      navigate('/')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell kicker={t('/ ĐĂNG KÝ')} title={t('Học cùng nhau,')} highlight={t('nhanh hơn.')}>
      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <span className="mb-1 block font-display font-bold">{t('Họ và tên')}</span>
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block font-display font-bold">Email</span>
          <input name="email" type="email" required autoComplete="email" className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block font-display font-bold">{t('Mật khẩu')}</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={64}
            autoComplete="new-password"
            className="field"
          />
          <span className="mt-1 block font-mono text-xs text-muted">{t('Tối thiểu 8 ký tự')}</span>
        </label>
        {error && (
          <p role="alert" className="animate-pop border-l-4 border-flame bg-paper px-3 py-2 text-sm">
            {error}
          </p>
        )}
        <button disabled={busy} className="btn btn-ink w-full disabled:opacity-60">
          {busy ? t('Đang tạo tài khoản...') : t('Tạo tài khoản →')}
        </button>
        <p className="text-sm text-muted">
          {t('Đã có tài khoản?')}{' '}
          <Link to="/login" className="link-wipe font-medium text-ink">
            {t('Đăng nhập')}
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
