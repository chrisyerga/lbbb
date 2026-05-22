import { HOW_STEPS } from '../landingContent'
import { Pill } from '../primitives/Pill'
import { Tape } from '../primitives/Tape'

const TAPE_COLORS = [
  'var(--landing-accent)',
  'var(--landing-soft)',
  'var(--landing-primary)',
] as const
const ROTATIONS = [-1.5, 1, -0.5] as const
const TAPE_ROTATIONS = [-12, 8, -4] as const

export function LandingHow() {
  return (
    <section
      id="how-it-works"
      className="relative px-4 py-16 sm:px-8 sm:py-24 lg:px-14 lg:py-[120px]"
    >
      <div className="mb-12 text-center sm:mb-16">
        <Pill
          bg="var(--landing-cream)"
          color="var(--landing-ink)"
          className="mb-4"
        >
          How it works
        </Pill>
        <h2 className="font-display m-0 text-[clamp(2.25rem,6vw,4rem)] leading-none font-extrabold tracking-tight text-[var(--landing-ink)]">
          Three steps. Then a famous dog.
        </h2>
      </div>

      <div className="grid gap-7 md:grid-cols-3 md:gap-7">
        {HOW_STEPS.map((s, i) => (
          <div
            key={s.n}
            className="relative rounded-[18px] border-2 border-[#14100E] bg-white p-7 max-md:rotate-0"
            style={{ transform: `rotate(${ROTATIONS[i]}deg)` }}
          >
            <Tape
              color={TAPE_COLORS[i]}
              w={70}
              rotate={TAPE_ROTATIONS[i]}
              className="absolute -top-2.5 left-6"
            />
            <div className="font-display text-[56px] leading-none font-extrabold tracking-tight text-[var(--landing-primary)]">
              {s.n}
            </div>
            <div className="mt-3.5 text-[42px]">{s.icon}</div>
            <h3 className="font-display mt-[18px] mb-2 text-2xl font-extrabold tracking-tight text-[var(--landing-ink)]">
              {s.t}
            </h3>
            <p className="m-0 text-[15.5px] leading-normal text-[var(--landing-ink)]/80">
              {s.d}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
