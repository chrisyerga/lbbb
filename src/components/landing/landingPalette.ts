export type LandingPalette = {
  name: string
  cream: string
  ink: string
  primary: string
  accent: string
  soft: string
}

export const V1_PALETTES = {
  tomato: {
    name: 'Tomato',
    cream: '#FBF1DE',
    ink: '#1A1410',
    primary: '#E0382E',
    accent: '#F2A02E',
    soft: '#F5E1B4',
  },
  spider: {
    name: 'Spider',
    cream: '#FCF6E8',
    ink: '#16100D',
    primary: '#D2401C',
    accent: '#FF8A3D',
    soft: '#F8D9B2',
  },
  mint: {
    name: 'Mint Pop',
    cream: '#F2F7EE',
    ink: '#0F1A14',
    primary: '#E94B3C',
    accent: '#3CB07A',
    soft: '#CDE9D6',
  },
  punch: {
    name: 'Punch',
    cream: '#FFF3F0',
    ink: '#1A0F10',
    primary: '#FF5C73',
    accent: '#7E5BFF',
    soft: '#FFD3DA',
  },
} as const satisfies Record<string, LandingPalette>

export type LandingPaletteKey = keyof typeof V1_PALETTES

export const DEFAULT_PALETTE_KEY: LandingPaletteKey = 'tomato'

export function getLandingPalette(key: LandingPaletteKey = DEFAULT_PALETTE_KEY) {
  return V1_PALETTES[key]
}

export function paletteToCssVars(
  palette: LandingPalette,
): Record<string, string> {
  return {
    '--landing-cream': palette.cream,
    '--landing-ink': palette.ink,
    '--landing-primary': palette.primary,
    '--landing-accent': palette.accent,
    '--landing-soft': palette.soft,
  }
}
