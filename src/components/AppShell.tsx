'use client'

import type { PropsWithChildren } from 'react'
import { DEFAULT_PALETTE_KEY, getLandingPalette, paletteToCssVars } from './landing/landingPalette'
import { useV1BodyClass } from './useV1BodyClass'

export function AppShell({ children }: PropsWithChildren) {
  const palette = getLandingPalette(DEFAULT_PALETTE_KEY)
  useV1BodyClass(true)

  return (
    <div className="landing-v1 min-h-screen" style={paletteToCssVars(palette)}>
      {children}
    </div>
  )
}
