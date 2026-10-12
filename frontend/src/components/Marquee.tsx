// Dải chữ chạy ngang liên tục, dừng khi rê chuột. Nội dung lặp hai lần để nối liền mạch
export default function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null
  // Ít mục thì nhân lên cho đủ kín màn hình rộng
  const row = Array.from({ length: Math.ceil(12 / items.length) }, () => items).flat()

  return (
    <div className="surface-dark overflow-hidden border-y-2 border-ink bg-ink py-3 text-paper" aria-hidden>
      <div className="marquee flex w-max">
        {[...row, ...row].map((item, i) => (
          <span key={i} className="flex items-center font-display font-bold whitespace-nowrap">
            {item}
            <span className="mx-6 inline-block size-2 rotate-45 bg-flame" />
          </span>
        ))}
      </div>
    </div>
  )
}
