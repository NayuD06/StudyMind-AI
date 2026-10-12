import { useEffect, useState } from 'react'

// Số chạy từ 0 lên giá trị thật trong khoảng nửa giây (bỏ qua nếu người dùng tắt chuyển động)
export function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.round(target * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? target : value
}
