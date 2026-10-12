// Dải chữ chạy ngang vô tận; nội dung được lặp 2 lần để nối liền mạch
export default function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items]
  return (
    <div className="overflow-hidden border-y-2 border-ink bg-ink py-3 text-paper">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {row.map((item, i) => (
          <span key={i} className="flex items-center font-display text-lg font-bold uppercase">
            <span className="px-6">{item}</span>
            <span className="size-2.5 rotate-45 bg-mark" />
          </span>
        ))}
      </div>
    </div>
  )
}
