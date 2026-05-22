'use client'

import { useEffect } from 'react'

export function useV1BodyClass(active: boolean) {
  useEffect(() => {
    if (!active) return
    document.body.classList.add('landing-v1-active')
    return () => document.body.classList.remove('landing-v1-active')
  }, [active])
}
