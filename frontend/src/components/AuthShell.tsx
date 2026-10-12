import type { ReactNode } from 'react'

type Props = { kicker: string; title: string; highlight: string; children: ReactNode }

// Khung chung cho trang đăng nhập và đăng ký: nửa trái là chữ lớn, nửa phải là form
export default function AuthShell({ kicker, title, highlight, children }: Props) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
      <div className="relative overflow-hidden border-2 border-ink bg-ink p-8 text-paper lg:p-12">
        <span className="absolute -top-10 -right-10 size-40 animate-float bg-flame" />
        <span className="absolute right-16 bottom-8 size-16 rotate-45 bg-mark" />
        <p className="relative font-mono text-xs text-paper/70">{kicker}</p>
        <h1 className="relative mt-4 font-display text-5xl leading-tight font-bold">
          <span className="block overflow-hidden">
            <span className="block animate-rise">{title}</span>
          </span>
          <span className="block overflow-hidden pb-2">
            <span className="block animate-rise text-mark" style={{ animationDelay: '120ms' }}>
              {highlight}
            </span>
          </span>
        </h1>
      </div>

      <div className="panel shadow-hard animate-pop self-center p-6 sm:p-8">{children}</div>
    </div>
  )
}
