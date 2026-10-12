import { Link } from 'react-router-dom'
import { t } from '../lib/i18n.ts'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 text-center">
      <p className="font-display text-8xl leading-none font-bold">
        4<span className="sticker inline-block text-flame">0</span>4
      </p>
      <p className="mt-4 text-lg text-muted">{t('Trang này không tồn tại.')}</p>
      <Link to="/" className="btn btn-ink mt-8">
        {t('← Về trang chủ')}
      </Link>
    </div>
  )
}
