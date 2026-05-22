import { TESTIMONIALS } from '../landingContent'
import { Pill } from '../primitives/Pill'
import { Star } from '../primitives/Star'

function testimonialBg(bg: (typeof TESTIMONIALS)[number]['bg']) {
  if (bg === 'soft') return 'var(--landing-soft)'
  return bg
}

export function LandingTestimonials() {
  return (
    <section className="relative px-4 py-16 sm:px-8 sm:py-24 lg:px-14 lg:py-[120px]">
      <div className="mb-12 text-center sm:mb-14">
        <Pill
          bg="var(--landing-soft)"
          color="var(--landing-ink)"
          className="mb-4"
        >
          Pet parents say
        </Pill>
        <h2 className="font-display m-0 text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-tight text-[var(--landing-ink)]">
          Bark of approval.
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3 md:gap-6">
        {TESTIMONIALS.map((q) => (
          <div
            key={q.name}
            className="relative rounded-2xl border-2 border-[#14100E] p-[26px] max-md:rotate-0"
            style={{
              background: testimonialBg(q.bg),
              transform: `rotate(${q.rotate}deg)`,
            }}
          >
            <div className="mb-3 flex gap-0.5">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star key={s} color="var(--landing-primary)" size={16} />
              ))}
            </div>
            <p className="font-display m-0 text-[22px] leading-tight font-extrabold tracking-tight text-[var(--landing-ink)]">
              &ldquo;{q.text}&rdquo;
            </p>
            <div className="mt-[22px] flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border-2 border-[#14100E] bg-[var(--landing-primary)]" />
              <div>
                <div className="text-sm font-bold text-[var(--landing-ink)]">
                  {q.name}
                </div>
                <div className="text-xs text-[var(--landing-ink)]/65">
                  {q.loc}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
