import { useEffect, useState } from 'react'

// Trả về giá trị sau khi người dùng ngừng thay đổi nó một lúc, để không gọi API theo từng phím gõ
export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
