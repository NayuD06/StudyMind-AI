import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthShell from '../components/AuthShell.tsx'
import { api, errorMessage } from '../lib/api.ts'
import { t } from '../lib/i18n.ts'

export default function ResetPasswordPage() {
  // Mã nằm sau dấu # nên trình duyệt không gửi nó lên máy chủ hay ghi vào nhật ký truy cập
  const token = useLocation().hash.slice(1)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  // Máy chủ từ chối (mã sai, hết hạn...) thì mới gợi ý xin thư mới
  const [rejected, setRejected] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const newPassword = String(form.get('newPassword'))
    if (newPassword !== form.get('confirm')) return setError(t('Hai lần nhập mật khẩu mới không khớp'))

    setBusy(true)
    setError('')
    setRejected(false)
    try {
      await api.post('/auth/reset-password', { token, newPassword })
      setDone(true)
    } catch (err) {
      setError(errorMessage(err))
      setRejected(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={t('Đặt lại mật khẩu')} note={t('Đặt xong, mọi thiết bị đang đăng nhập sẽ bị đăng xuất.')}>
      {done ? (
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold">{t('Đã đặt mật khẩu mới')}</h2>
          <p className="text-sm text-muted">{t('Mọi thiết bị đang đăng nhập đã bị đăng xuất. Hãy đăng nhập lại bằng mật khẩu mới.')}</p>
          <Link to="/login" className="btn btn-ink">
            {t('Đăng nhập')}
          </Link>
        </div>
      ) : !token ? (
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold">{t('Liên kết không đầy đủ')}</h2>
          <p className="text-sm text-muted">{t('Hãy mở đúng liên kết trong thư, hoặc yêu cầu gửi lại thư mới.')}</p>
          <Link to="/forgot-password" className="btn btn-ink">
            {t('Gửi lại thư')}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="mb-1 block font-display font-bold">{t('Mật khẩu mới')}</span>
            <input name="newPassword" type="password" required minLength={8} maxLength={64} autoComplete="new-password" className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block font-display font-bold">{t('Nhập lại mật khẩu mới')}</span>
            <input name="confirm" type="password" required minLength={8} maxLength={64} autoComplete="new-password" className="field" />
          </label>
          {error && (
            <p role="alert" className="animate-pop border-l-4 border-flame bg-paper px-3 py-2 text-sm">
              {error}
              {rejected && (
                <Link to="/forgot-password" className="link-wipe ml-2 font-medium">
                  {t('Gửi lại thư')}
                </Link>
              )}
            </p>
          )}
          <button disabled={busy} className="btn btn-ink w-full disabled:opacity-60">
            {busy ? t('Đang lưu...') : t('Đặt mật khẩu mới')}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
