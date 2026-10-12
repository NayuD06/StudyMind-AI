import { useEffect, useState } from 'react'

// Gõ lần lượt từng câu rồi xóa đi; `phrases` phải là hằng số ngoài component
export function useTypewriter(phrases: string[], speed = 55, pause = 1600) {
  const [text, setText] = useState('')

  useEffect(() => {
    let phrase = 0
    let length = 0
    let deleting = false
    let timer = window.setTimeout(tick, 500)

    function tick() {
      const current = phrases[phrase]
      length += deleting ? -1 : 1
      setText(current.slice(0, length))

      let delay = deleting ? speed / 2 : speed
      if (!deleting && length === current.length) {
        deleting = true
        delay = pause
      } else if (deleting && length === 0) {
        deleting = false
        phrase = (phrase + 1) % phrases.length
        delay = 350
      }
      timer = window.setTimeout(tick, delay)
    }

    return () => window.clearTimeout(timer)
  }, [phrases, speed, pause])

  return text
}
