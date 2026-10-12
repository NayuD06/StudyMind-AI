import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../components/AuthShell.tsx'
import { api, errorMessage } from '../lib/api.ts'
import { t } from '../lib/i18n.ts'

export default function ForgotPasswordPage() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email'))
    setBusy(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSentTo(email)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={t('Quên mật khẩu')} note={t('Chúng tôi gửi một liên kết qua email để bạn đặt mật khẩu mới.')}>
      {sentTo ? (
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold">{t('Kiểm tra hộp thư')}</h2>
          {/* Không nói email có tồn tại hay không, để người lạ không dò được ai đã đăng ký */}
          <p className="text-sm">{t('Nếu {0} đã đăng ký, chúng tôi vừa gửi tới đó một liên kết đặt lại mật khẩu.', sentTo)}</p>
          <p className="text-sm text-muted">{t('Liên kết có hiệu lực 30 phút và chỉ dùng được một lần. Không thấy thư thì xem cả mục thư rác.')}</p>
          <Link to="/login" className="btn btn-ink">
            {t('← Về đăng nhập')}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="mb-1 block font-display font-bold">{t('Email bạn đã đăng ký')}</span>
            <input name="email" type="email" required autoComplete="email" className="field" />
          </label>
          {error && (
            <p role="alert" className="animate-pop border-l-4 border-flame bg-paper px-3 py-2 text-sm">
              {error}
            </p>
          )}
          <button disabled={busy} className="btn btn-ink w-full disabled:opacity-60">
            {busy ? t('Đang gửi...') : t('Gửi liên kết')}
          </button>
          <p className="text-sm text-muted">
            <Link to="/login" className="link-wipe font-medium text-ink">
              {t('← Về đăng nhập')}
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
