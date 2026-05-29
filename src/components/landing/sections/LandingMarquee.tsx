import { MARQUEE_ITEMS } from '../landingContent'

export function LandingMarquee() {
  const row = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

  return (
    <div className="overflow-hidden border-y-2 border-[#14100E] bg-[var(--landing-ink)] py-3.5 text-[var(--landing-cream)]">
      <div className="animate-v1-marq flex w-max gap-9 whitespace-nowrap">
        {row.map((s, i) => (
          <span key={`${s}-${i}`} className="font-display text-lg font-extrabold tracking-wide sm:text-[22px]">
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
