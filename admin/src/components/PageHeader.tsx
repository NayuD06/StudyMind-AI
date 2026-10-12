import type { ReactNode } from 'react'

export default function PageHeader({ code, title, children }: { code: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
      <div>
        <p className="font-mono text-xs text-muted">/ {code}</p>
        <h1 className="mt-1 overflow-hidden pb-1 font-display text-4xl font-bold md:text-5xl">
          <span className="block animate-rise">{title}</span>
        </h1>
      </div>
      {children}
    </header>
  )
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="mb-4 animate-pop border-l-4 border-flame bg-sheet px-3 py-2 text-sm">
      {message}
    </p>
  )
}
