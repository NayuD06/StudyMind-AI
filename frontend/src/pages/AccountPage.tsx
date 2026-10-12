import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'
import { t } from '../lib/i18n.ts'

export default function AccountPage() {
  const { user, loading, changePassword, logoutAll, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setSavingProfile(true)
    setProfileSaved(false)
    setError('')
    try {
      await updateProfile({ name: String(form.get('name')), school: String(form.get('school')), major: String(form.get('major')) })
      setProfileSaved(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSavingProfile(false)
    }
  }

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
        <h1 className="font-display text-4xl font-bold">{t('Cần đăng nhập để xem tài khoản')}</h1>
        <Link to="/login" className="btn btn-ink mt-6">
          {t('Đăng nhập')}
        </Link>
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">{t('Tài khoản')}</h1>
      <p className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-muted">
        <span>{user.email}</span>
        <Link to={`/users/${user.id}`} className="text-ink underline underline-offset-4">
          {t('Xem trang công khai')}
        </Link>
      </p>

      {error && (
        <p role="alert" className="mt-6 animate-pop border-l-4 border-flame bg-sheet px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="mt-6 animate-pop border-l-4 border-ink bg-mark/40 px-3 py-2 text-sm">
          {t('Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.')}
        </p>
      )}

      {profileSaved && (
        <p role="status" className="mt-6 animate-pop border-l-4 border-ink bg-mark/40 px-3 py-2 text-sm">
          {t('Đã lưu hồ sơ.')}
        </p>
      )}

      <form onSubmit={saveProfile} className="panel mt-8 space-y-5 p-6">
        <h2 className="font-display text-2xl font-bold">{t('Hồ sơ')}</h2>
        <label className="block">
          <span className="mb-1 block font-display font-bold">{t('Họ tên')}</span>
          <input name="name" required minLength={2} maxLength={80} defaultValue={user.name} autoComplete="name" className="field" />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-display font-bold">{t('Trường')}</span>
            <input name="school" maxLength={120} defaultValue={user.school ?? ''} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block font-display font-bold">{t('Ngành')}</span>
            <input name="major" maxLength={120} defaultValue={user.major ?? ''} className="field" />
          </label>
        </div>
        <p className="text-sm text-muted">{t('Tên, trường và ngành hiện trên trang công khai của bạn và được điền sẵn khi đăng tài liệu. Email không hiển thị cho ai.')}</p>
        <button disabled={savingProfile} className="btn btn-ink disabled:opacity-60">
          {savingProfile ? t('Đang lưu...') : t('Lưu hồ sơ')}
        </button>
      </form>

      <form onSubmit={submit} className="panel mt-8 space-y-5 p-6">
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
        <button disabled={busy} className="btn btn-ink disabled:opacity-60">
          {busy ? t('Đang đổi...') : t('Đổi mật khẩu')}
        </button>
      </form>

      <div className="panel mt-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="max-w-md">
          <h2 className="font-display text-2xl font-bold">{t('Đăng xuất mọi thiết bị')}</h2>
          <p className="mt-1 text-sm text-muted">{t('Dùng khi bạn quên đăng xuất ở máy lạ. Thiết bị này cũng sẽ bị đăng xuất.')}</p>
        </div>
        <button onClick={signOutEverywhere} className="btn">
          {t('Đăng xuất tất cả')}
        </button>
      </div>
    </div>
  )
}
