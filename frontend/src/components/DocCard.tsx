import { Link } from 'react-router-dom'
import { ratingText, subjectCode, subjectName, type DocSummary } from '../lib/documents.ts'
import { t } from '../lib/i18n.ts'

export default function DocCard({ doc }: { doc: DocSummary }) {
  return (
    <Link
      to={`/documents/${doc.id}`}
      className="panel doc-card group relative flex h-full flex-col"
    >
      {/* Góc giấy gập */}
      <span className="fold absolute top-0 right-0 size-0" />

      <div className="flex items-center gap-2 px-4 pt-4 pr-8 text-xs text-muted">
        <span className="code bg-ink px-1.5 py-0.5 font-mono text-paper">{subjectCode(doc)}</span>
        <span className="truncate">{doc.school ?? doc.uploader.name}</span>
      </div>

      <div className="flex-1 px-4 pt-3 pb-5">
        <h3 className="line-clamp-3 font-display text-lg leading-snug font-bold group-hover:underline">{doc.title}</h3>
        <p className="mt-1.5 text-sm text-muted">{subjectName(doc) ?? t('Chưa phân môn')}</p>
      </div>

      <p className="flex gap-4 border-t-2 border-ink px-4 py-2 text-xs text-muted">
        <span>{t('{0} trang', doc.pageCount ?? '?')}</span>
        <span>★ {ratingText(doc.rating)}</span>
        <span className="ml-auto">{t('{0} lượt tải', doc.downloadCount)}</span>
      </p>
    </Link>
  )
}
