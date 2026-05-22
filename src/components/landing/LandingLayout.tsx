'use client'

import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'
import {
  DEFAULT_PALETTE_KEY,
  getLandingPalette,
  paletteToCssVars,
} from './landingPalette'
import landingCss from '../../styles/landing-v1.css?url'

let landingCssInjected = false

function useLandingBodyClass() {
  useEffect(() => {
    document.body.classList.add('landing-v1-active')
    return () => document.body.classList.remove('landing-v1-active')
  }, [])
}

function useLandingStylesheet() {
  useEffect(() => {
    if (landingCssInjected) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = landingCss
    link.id = 'landing-v1-css'
    document.head.appendChild(link)
    landingCssInjected = true
  }, [])
}

export function LandingLayout({ children }: PropsWithChildren) {
  const palette = getLandingPalette(DEFAULT_PALETTE_KEY)
  useLandingBodyClass()
  useLandingStylesheet()

  return (
    <div className="landing-v1 scroll-smooth" style={paletteToCssVars(palette)}>
      {children}
    </div>
  )
}
