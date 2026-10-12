import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DocCard from '../components/DocCard.tsx'
import Marquee from '../components/Marquee.tsx'
import Reveal from '../components/Reveal.tsx'
import { useAuth } from '../lib/auth.tsx'
import { fetchDocuments, fetchSubjects, subjectName } from '../lib/documents.ts'
import { locale, t } from '../lib/i18n.ts'

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [query, setQuery] = useState('')

  const subjects = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const latest = useQuery({
    queryKey: ['documents', 'latest'],
    queryFn: () => fetchDocuments({ limit: 5 }),
  })
  const popular = useQuery({
    queryKey: ['documents', 'featured'],
    queryFn: () => fetchDocuments({ sort: 'popular', limit: 4 }),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/documents?q=${encodeURIComponent(q)}` : '/documents')
  }

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-x-14 gap-y-12 px-4 pt-12 pb-16 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div className="stagger">
          <h1 className="font-display text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
            {t('Tìm tài liệu học tập')}
            <br />
            <span className="mark">{t('theo đúng môn bạn cần')}</span>
          </h1>

          <p className="mt-5 max-w-lg text-lg text-muted">
            {t('Đề cương, slide, bài giải do sinh viên đăng lên. Đọc ngay trên trình duyệt, tải về khi cần.')}
          </p>

          <form onSubmit={submit} className="mt-8 flex max-w-lg shadow-hard">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Tên tài liệu, môn học...')}
              aria-label={t('Tìm tài liệu')}
              className="min-w-0 flex-1 border-2 border-r-0 border-ink bg-sheet px-4 py-3 outline-none focus:bg-mark/20"
            />
            <button className="border-2 border-ink bg-ink px-6 font-display font-bold text-paper transition-colors hover:bg-flame hover:text-coal">
              {t('Tìm')}
            </button>
          </form>

          {subjects.data && subjects.data.length > 0 && (
            <p className="mt-6 flex max-w-lg flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="text-muted">{t('Môn có sẵn:')}</span>
              {subjects.data.slice(0, 6).map((subject) => (
                <Link key={subject.id} to={`/documents?subject=${subject.id}`} className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                  {t(subject.name)}
                </Link>
              ))}
            </p>
          )}
        </div>

        {/* Tài liệu vừa đăng, lấy thật từ thư viện */}
        <div className="page-in group/latest relative self-start [animation-delay:150ms]">
          <div className="absolute inset-0 translate-x-2 translate-y-2 border-2 border-ink bg-mark transition-transform duration-300 group-hover/latest:translate-x-3.5 group-hover/latest:translate-y-3.5" />
          {latest.data && latest.data.total > 0 && (
            <span className="sticker absolute -top-4 -left-3 z-10 border-2 border-ink bg-flame px-2 py-0.5 font-display text-sm font-bold text-coal">
              {t('{0} tài liệu', latest.data.total)}
            </span>
          )}
          <div className="panel relative">
            <h2 className="flex items-baseline justify-between border-b-2 border-ink px-4 py-3 font-display font-bold">
              {t('Mới đăng')}
              <Link to="/documents" className="text-sm font-normal text-muted underline underline-offset-4 hover:text-ink">
                {t('Xem tất cả')}
              </Link>
            </h2>
            <ul>
              {latest.data?.items.map((doc) => (
                <li key={doc.id} className="border-ink/15 not-last:border-b">
                  <Link to={`/documents/${doc.id}`} className="row-slide block px-4 py-3 hover:bg-mark/30">
                    <span className="block truncate font-medium">{doc.title}</span>
                    <span className="mt-0.5 block truncate text-sm text-muted">
                      {[subjectName(doc), doc.pageCount && t('{0} trang', doc.pageCount), new Date(doc.createdAt).toLocaleDateString(locale)]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {latest.data?.items.length === 0 && (
              <p className="px-4 py-10 text-center text-muted">
                {t('Thư viện chưa có tài liệu nào.')}{' '}
                <Link to="/upload" className="text-ink underline underline-offset-4">
                  {t('Đăng tài liệu đầu tiên')}
                </Link>
              </p>
            )}
            {latest.isPending && (
              <div className="space-y-4 p-4" aria-label={t('Đang tải dữ liệu...')}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="skeleton h-4 w-4/5" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {subjects.data && <Marquee items={subjects.data.map((subject) => t(subject.name))} />}

      {popular.data && popular.data.items.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14 pb-20">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-t-2 border-ink pt-8">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{t('Đang được tải nhiều')}</h2>
            <Link to="/documents?sort=popular" className="link-wipe font-medium">
              {t('Xem tất cả →')}
            </Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popular.data.items.map((doc, i) => (
              <Reveal key={doc.id} delay={i * 70}>
                <DocCard doc={doc} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="stripes border-t-2 border-ink bg-flame text-coal">
        <Reveal className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-10">
          <h2 className="max-w-2xl font-display text-2xl font-bold sm:text-3xl">{t('Có tài liệu hay? Đăng lên để cả lớp cùng ôn.')}</h2>
          <Link to={user ? '/upload' : '/register'} className="btn">
            {user ? t('Đăng tài liệu') : t('Tạo tài khoản')}
          </Link>
        </Reveal>
      </section>
    </>
  )
}
