import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DocCard from '../components/DocCard.tsx'
import Marquee from '../components/Marquee.tsx'
import Reveal from '../components/Reveal.tsx'
import { fetchDocuments, fetchSubjects } from '../lib/documents.ts'
import { useTypewriter } from '../lib/useTypewriter.ts'
import { t } from '../lib/i18n.ts'

const SAMPLE_QUERIES = [
  t('tài liệu ôn thi cơ sở dữ liệu'),
  t('làm sao biết lịch biểu khả tuần tự?'),
  t('giải thích thuật toán A* dễ hiểu'),
  t('đề cương mạng máy tính tầng giao vận'),
]

// Chạy trên dải chữ khi chưa tải được danh sách môn
const TOPICS = [t('Tìm kiếm ngữ nghĩa'), t('Hỏi đáp có trích dẫn'), t('Tóm tắt tài liệu'), t('Câu hỏi ôn tập')]

const HEADLINE = [t('Hỏi tài liệu.'), t('Nhận câu trả lời')]

const STEPS = [
  { title: t('Tải tài liệu PDF'), text: t('Kiểm tra tệp và lưu thông tin tài liệu.') },
  { title: t('Trích xuất văn bản'), text: t('Đọc nội dung, chia thành các đoạn nhỏ.') },
  { title: t('Tạo embedding'), text: t('Chuyển từng đoạn thành vector ngữ nghĩa.') },
  { title: t('Tìm đoạn liên quan'), text: t('Xếp hạng theo độ tương đồng với câu hỏi.') },
  { title: t('Trả lời có căn cứ'), text: t('Sinh câu trả lời kèm số trang trích dẫn.') },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const placeholder = useTypewriter(SAMPLE_QUERIES)

  const subjects = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const featured = useQuery({
    queryKey: ['documents', 'featured'],
    queryFn: () => fetchDocuments({ sort: 'popular', limit: 4 }),
  })

  // Đốm sáng màu dạ quang đi theo con trỏ trong vùng hero
  function trackPointer(e: MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    navigate(`/documents?q=${encodeURIComponent(query)}`)
  }

  return (
    <>
      <section onMouseMove={trackPointer} className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_circle_at_var(--mx,70%)_var(--my,30%),rgb(255_226_74/0.55),transparent_70%)]" />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div>
            <p className="mb-6 inline-block animate-pop border-2 border-ink bg-sheet px-3 py-1 font-mono text-xs">
              {t('TÌM KIẾM NGỮ NGHĨA × RAG')}
            </p>

            <h1 className="font-display text-5xl leading-[1.05] font-bold sm:text-6xl lg:text-7xl">
              {HEADLINE.map((line, i) => (
                <span key={line} className="block overflow-hidden pb-1">
                  <span className="block animate-rise" style={{ animationDelay: `${i * 120}ms` }}>
                    {line}
                  </span>
                </span>
              ))}
              <span className="block overflow-hidden pb-2">
                <span className="block animate-rise" style={{ animationDelay: '240ms' }}>
                  {t('có')} <span className="mark">{t('trích dẫn')}</span>.
                </span>
              </span>
            </h1>

            <p className="mt-6 max-w-xl animate-pop text-lg text-muted" style={{ animationDelay: '500ms' }}>
              {t('Chia sẻ tài liệu học tập, tìm bằng câu hỏi tự nhiên và nhờ AI giải thích dựa trên chính nội dung tài liệu đó.')}
            </p>

            <form
              onSubmit={submit}
              className="mt-8 flex max-w-xl animate-pop shadow-hard transition-shadow focus-within:shadow-[8px_8px_0_var(--color-flame)]"
              style={{ animationDelay: '650ms' }}
            >
              <div className="relative flex-1">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label={t('Tìm tài liệu')}
                  className="h-full w-full border-2 border-r-0 border-ink bg-sheet px-4 py-4 outline-none"
                />
                {!query && (
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
                    {placeholder}
                    <span className="ml-0.5 h-5 w-0.5 animate-blink bg-ink" />
                  </span>
                )}
              </div>
              <button className="border-2 border-ink bg-ink px-6 font-display font-bold text-paper transition-colors hover:bg-flame hover:text-ink">
                {t('TÌM')}
              </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/documents" className="btn btn-ink">
                {t('Vào thư viện →')}
              </Link>
              <Link to="/upload" className="btn">
                {t('Đăng tài liệu')}
              </Link>
            </div>
          </div>

          {/* Minh họa một lượt hỏi đáp trên tài liệu */}
          <div className="relative animate-float self-center">
            <div className="panel absolute inset-0 translate-x-5 translate-y-5 rotate-3 bg-mark" />
            <div className="panel absolute inset-0 translate-x-2 translate-y-2 -rotate-2" />
            <div className="panel relative">
              <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2 font-mono text-xs">
                <span className="truncate">CSDL_GiaoTac.pdf</span>
                <span className="text-muted">{t('tr. 42/118')}</span>
              </div>
              <div className="space-y-4 p-5">
                <p
                  className="ml-auto w-fit max-w-[85%] animate-pop bg-ink px-3 py-2 text-sm text-paper"
                  style={{ animationDelay: '900ms' }}
                >
                  {t('Làm sao biết một lịch biểu khả tuần tự?')}
                </p>
                <div className="animate-pop border-l-4 border-flame pl-3 text-sm" style={{ animationDelay: '1500ms' }}>
                  <p>
                    {t('Vẽ')} <b>{t('đồ thị ưu tiên')}</b> {t('của lịch biểu. Nếu đồ thị')} <span className="bg-mark px-1">{t('không có chu trình')}</span>{' '}
                    {t('thì lịch biểu khả tuần tự xung đột.')}
                  </p>
                  <div className="mt-3 flex gap-2 font-mono text-xs">
                    {[t('tr. 42'), t('tr. 45')].map((page, i) => (
                      <span
                        key={page}
                        className="animate-pop border-2 border-ink px-2 py-0.5 transition-colors hover:bg-ink hover:text-paper"
                        style={{ animationDelay: `${2000 + i * 180}ms` }}
                      >
                        [{page}]
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee items={subjects.data?.length ? subjects.data.map((subject) => t(subject.name)) : TOPICS} />

      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <p className="font-mono text-xs text-muted">{t('/ CÁCH HOẠT ĐỘNG')}</p>
          <h2 className="mt-2 font-display text-4xl font-bold">{t('Từ file PDF đến câu trả lời')}</h2>
        </Reveal>

        <div className="mt-10 grid border-2 border-ink bg-sheet sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 90} className="h-full">
              <div className="group h-full border-ink p-5 transition-colors duration-300 hover:bg-mark max-lg:border-b-2 lg:border-r-2 lg:[.reveal:last-child_&]:border-r-0">
                <p className="font-mono text-5xl font-semibold text-ink/15 transition-colors duration-300 group-hover:text-ink">
                  0{i + 1}
                </p>
                <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted group-hover:text-ink">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-muted">{t('/ TÀI LIỆU NỔI BẬT')}</p>
            <h2 className="mt-2 font-display text-4xl font-bold">{t('Đang được tải nhiều')}</h2>
          </div>
          <Link to="/documents" className="link-wipe font-display font-bold">
            {t('Xem tất cả →')}
          </Link>
        </Reveal>

        {featured.data?.items.length === 0 ? (
          <div className="panel mt-10 px-6 py-12 text-center">
            <p className="font-display text-2xl font-bold">{t('Thư viện đang chờ tài liệu đầu tiên')}</p>
            <Link to="/upload" className="btn btn-flame mt-6">
              {t('Đăng tài liệu →')}
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.data?.items.map((doc, i) => (
              <Reveal key={doc.id} delay={i * 90}>
                <DocCard doc={doc} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="border-t-2 border-ink bg-flame">
        <Reveal className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-14">
          <h2 className="max-w-2xl font-display text-3xl font-bold sm:text-4xl">
            {t('Có tài liệu hay? Đăng lên để cả lớp cùng ôn.')}
          </h2>
          <Link to="/register" className="btn">
            {t('Tạo tài khoản →')}
          </Link>
        </Reveal>
      </section>
    </>
  )
}
