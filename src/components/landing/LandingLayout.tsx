'use client'

import type { PropsWithChildren } from 'react'
import { DEFAULT_PALETTE_KEY, getLandingPalette, paletteToCssVars } from './landingPalette'
import { useV1BodyClass } from '../useV1BodyClass'

export function LandingLayout({ children }: PropsWithChildren) {
  const palette = getLandingPalette(DEFAULT_PALETTE_KEY)
  useV1BodyClass(true)

  return (
    <div className="landing-v1 scroll-smooth min-h-screen" style={paletteToCssVars(palette)}>
      {children}
    </div>
  )
}
