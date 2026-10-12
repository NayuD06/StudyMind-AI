import { useEffect, useState } from 'react'

// Số chạy từ 0 lên giá trị thật khi dữ liệu về
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let frame = 0
    const startedAt = performance.now()
    const length = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : duration
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / length, 1)
      // Chậm dần về cuối
      setValue(Math.round(target * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}
