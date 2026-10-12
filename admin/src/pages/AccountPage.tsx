import { useState, type FormEvent } from 'react'
import PageHeader, { ErrorNote } from '../components/PageHeader.tsx'
import { errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'
import { t } from '../lib/i18n.ts'

export default function AccountPage() {
  const { user, changePassword, logoutAll } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const el = e.currentTarget
    const form = new FormData(el)
    const newPassword = String(form.get('newPassword'))
    setDone(false)
    if (newPassword !== form.get('confirm')) return setError(t('Hai lần nhập mật khẩu mới không khớp'))

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

  return (
    <>
      <PageHeader code={t('07 · TÀI KHOẢN')} title={t('Tài khoản')}>
        <p className="font-mono text-xs text-muted">{user?.email}</p>
      </PageHeader>

      {error && <ErrorNote message={error} />}
      {done && (
        <p role="status" className="mb-4 animate-pop border-l-4 border-ink bg-mark/40 px-3 py-2 text-sm">
          {t('Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.')}
        </p>
      )}

      <form onSubmit={submit} className="panel max-w-2xl space-y-5 p-6">
        <h2 className="font-display text-2xl font-bold">{t('Đổi mật khẩu')}</h2>
        <label className="block">
          <span className="mb-1 block font-display font-bold">{t('Mật khẩu hiện tại')}</span>
          <input name="currentPassword" type="password" required maxLength={64} autoComplete="current-password" className="field" />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-display font-bold">{t('Mật khẩu mới')}</span>
            <input name="newPassword" type="password" required minLength={8} maxLength={64} autoComplete="new-password" className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block font-display font-bold">{t('Nhập lại mật khẩu mới')}</span>
            <input name="confirm" type="password" required minLength={8} maxLength={64} autoComplete="new-password" className="field" />
          </label>
        </div>
        <button disabled={busy} className="btn btn-ink">
          {busy ? t('Đang đổi...') : t('Đổi mật khẩu')}
        </button>
      </form>

      <div className="panel mt-6 flex max-w-2xl flex-wrap items-center justify-between gap-4 p-6">
        <div className="max-w-sm">
          <h2 className="font-display text-2xl font-bold">{t('Đăng xuất mọi thiết bị')}</h2>
          <p className="mt-1 text-sm text-muted">{t('Hủy mọi phiên đang mở của tài khoản này, kể cả ở trang sinh viên.')}</p>
        </div>
        <button onClick={() => logoutAll().catch((err) => setError(errorMessage(err)))} className="btn btn-flame">
          {t('Đăng xuất tất cả')}
        </button>
      </div>
    </>
  )
}
