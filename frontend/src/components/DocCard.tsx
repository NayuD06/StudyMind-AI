import { Link } from 'react-router-dom'
import { ratingText, subjectCode, subjectName, type DocSummary } from '../lib/documents.ts'

export default function DocCard({ doc }: { doc: DocSummary }) {
  return (
    <Link
      to={`/documents/${doc.id}`}
      className="panel group relative flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--color-flame)]"
    >
      {/* Góc giấy gập: lớn dần khi hover */}
      <span className="absolute top-0 right-0 size-0 border-b-[28px] border-l-[28px] border-b-ink border-l-transparent transition-all duration-200 group-hover:border-b-[44px] group-hover:border-l-[44px] group-hover:border-b-flame" />

      <div className="flex items-center gap-2 border-b-2 border-ink px-4 py-2 pr-9 font-mono text-xs">
        <span className="bg-ink px-1.5 py-0.5 text-paper">{subjectCode(doc)}</span>
        <span className="truncate text-muted">{doc.school ?? doc.uploader.name}</span>
      </div>

      <div className="flex-1 px-4 py-5">
        <h3 className="line-clamp-3 font-display text-xl leading-snug font-bold">{doc.title}</h3>
        <p className="mt-2 text-sm text-muted">{subjectName(doc) ?? 'Chưa phân môn'}</p>
      </div>

      <div className="flex items-center gap-4 border-t-2 border-ink px-4 py-2 font-mono text-xs">
        <span>{doc.pageCount ?? '?'} tr.</span>
        <span>★ {ratingText(doc.rating)}</span>
        <span>↓ {doc.downloadCount}</span>
        <span className="ml-auto -translate-x-2 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          XEM →
        </span>
      </div>
    </Link>
  )
}
