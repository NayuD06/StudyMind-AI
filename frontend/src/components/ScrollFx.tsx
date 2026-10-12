import { useEffect, useRef, useState } from 'react'
import { t } from '../lib/i18n.ts'

// Vạch cam dưới thanh đầu trang chạy theo độ cuộn, kèm nút lên đầu trang khi đã cuộn xa
export default function ScrollFx() {
  const bar = useRef<HTMLSpanElement>(null)
  const [far, setFar] = useState(false)

  useEffect(() => {
    let frame = 0
    function update() {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`
      setFar(window.scrollY > 500)
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      <span ref={bar} className="absolute inset-x-0 -bottom-[5px] h-[3px] origin-left scale-x-0 bg-flame" />
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label={t('Lên đầu trang')}
        title={t('Lên đầu trang')}
        tabIndex={far ? 0 : -1}
        className={`btn btn-sm fixed right-4 bottom-4 z-20 px-3 transition-all duration-200 ${far ? '' : 'pointer-events-none translate-y-4 opacity-0'}`}
      >
        ↑
      </button>
    </>
  )
}
