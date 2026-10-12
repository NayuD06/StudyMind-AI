import type { ReactNode } from 'react'

type Props = { title: string; note: string; children: ReactNode }

// Khung chung cho các trang đăng nhập, đăng ký, quên mật khẩu: nửa trái là tiêu đề, nửa phải là form
export default function AuthShell({ title, note, children }: Props) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 lg:grid-cols-[1fr_1.1fr] lg:py-20">
      <div className="surface-dark relative overflow-hidden border-2 border-ink bg-ink p-8 text-paper lg:p-10">
        <span className="absolute top-0 right-0 size-14 bg-flame" />
        <span className="drift absolute right-10 bottom-8 size-20 border-2 border-mark" />
        <span className="drift absolute right-24 bottom-20 size-8 bg-mark [animation-delay:-4s]" />
        <h1 className="page-in relative font-display text-4xl leading-tight font-bold lg:text-5xl">{title}</h1>
        <p className="relative mt-4 max-w-xs text-paper/70">{note}</p>
      </div>

      <div className="panel shadow-hard self-center p-6 sm:p-8">{children}</div>
    </div>
  )
}
