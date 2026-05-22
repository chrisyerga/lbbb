import { ART_TILES } from '../landingContent'
import { getLandingPalette } from '../landingPalette'
import { ArtTile } from '../primitives/ArtTile'
import { Pill } from '../primitives/Pill'

const palette = getLandingPalette()

function tileAccent(tile: (typeof ART_TILES)[number]) {
  if ('accent' in tile && tile.accent) return tile.accent
  if ('accentKey' in tile) {
    if (tile.accentKey === 'primary') return palette.primary
    if (tile.accentKey === 'accent') return palette.accent
    return palette.ink
  }
  return palette.accent
}

export function LandingSocial() {
  return (
    <section className="relative px-4 py-10 sm:px-8 sm:py-16 lg:px-14 lg:pb-[120px]">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
        <div>
          <Pill
            bg="var(--landing-cream)"
            color="var(--landing-ink)"
            className="mb-[18px]"
          >
            The art
          </Pill>
          <h2 className="font-display m-0 text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.95] font-extrabold tracking-tight text-[var(--landing-ink)]">
            Six fresh
            <br />
            portraits.
            <br />
            <span className="text-[var(--landing-primary)]">Every. Day.</span>
          </h2>
          <p className="mt-[22px] max-w-[380px] text-[17px] leading-normal text-[var(--landing-ink)]/80">
            Same dog, six aesthetics. Pick a favorite, schedule the rest, or
            remix the prompt and roll again.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-[18px]">
          {ART_TILES.map((t) => (
            <ArtTile
              key={t.l}
              palette={palette}
              label={t.l}
              accent={tileAccent(t)}
              rotate={t.r}
              className="aspect-square border-2 border-[#14100E] max-sm:rotate-0"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
