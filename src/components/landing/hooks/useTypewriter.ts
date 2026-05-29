'use client'

import { useEffect, useState } from 'react'

type UseTypewriterOptions = {
  speed?: number
  startDelay?: number
  loop?: boolean
  pause?: number
}

export function useTypewriter(
  text: string,
  { speed = 26, startDelay = 600, loop = true, pause = 5000 }: UseTypewriterOptions = {},
) {
  const [shown, setShown] = useState('')

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const run = () => {
      setShown('')
      let i = 0
      const tick = () => {
        if (cancelled) return
        if (i <= text.length) {
          setShown(text.slice(0, i))
          i += 1
          timer = setTimeout(tick, speed + (Math.random() * 18 - 9))
        } else if (loop) {
          timer = setTimeout(run, pause)
        }
      }
      timer = setTimeout(tick, startDelay)
    }

    run()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [text, speed, startDelay, loop, pause])

  return shown
}
