import type { ReactNode } from 'react'

export default function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
      <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
      {children}
    </header>
  )
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="mb-4 border-l-4 border-flame bg-sheet px-3 py-2 text-sm">
      {message}
    </p>
  )
}
