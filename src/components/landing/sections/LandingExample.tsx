import { EXAMPLE_FEATURES } from '../landingContent'
import { Pill } from '../primitives/Pill'
import { SunBurst } from '../primitives/SunBurst'
import { Tape } from '../primitives/Tape'

export function LandingExample() {
  return (
    <section id="examples" className="relative px-4 py-16 sm:px-8 sm:py-24 lg:px-14 lg:py-[120px]">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
        <div>
          <Pill bg="var(--landing-soft)" color="var(--landing-ink)" className="mb-[18px]">
            The post, finished
          </Pill>
          <h2 className="font-display m-0 text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.95] font-extrabold tracking-tight text-[var(--landing-ink)]">
            Reads like
            <br />
            <span className="text-[var(--landing-primary)]">your favorite</span>
            <br />
            pet column.
          </h2>
          <p className="mt-[22px] max-w-[440px] text-[17px] leading-normal text-[var(--landing-ink)]/80">
            Every entry becomes a 400-word post in a voice you choose — earnest, sarcastic, full Wes-Anderson. Tweak a
            line, then publish to your own cafezoe page or schedule it straight to Instagram.
          </p>
          <ul className="mt-6 list-none p-0 text-[15px]">
            {EXAMPLE_FEATURES.map((t) => (
              <li key={t} className="mb-2.5 flex items-center gap-2.5 text-[var(--landing-ink)]">
                <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[var(--landing-primary)] text-[13px] font-extrabold text-white">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <Tape color="var(--landing-accent)" w={120} rotate={-10} className="absolute -top-3.5 left-8 z-[3]" />
          <Tape
            color="var(--landing-primary)"
            w={80}
            rotate={12}
            className="absolute -top-2.5 right-10 z-[3] max-sm:hidden"
          />
          <div className="-rotate-[1.5deg] overflow-hidden rounded-[18px] border-2 border-[#14100E] bg-white max-md:rotate-0">
            <div
              className="relative h-[200px] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, var(--landing-primary), var(--landing-accent))',
              }}
            >
              <SunBurst color="rgba(255,255,255,.3)" size={180} className="absolute -top-[30px] -right-[30px]" />
              <img
                src="/images/zoe-laptop.png"
                alt=""
                className="absolute -right-5 -bottom-2.5 w-[280px] max-w-[85%]"
              />
              <div className="font-mono absolute bottom-[18px] left-[22px] text-[11px] tracking-[0.1em] whitespace-nowrap text-white/85 uppercase">
                cover · auto-painted
              </div>
            </div>
            <div className="p-[26px]">
              <div className="font-mono text-[11px] tracking-[0.06em] text-[var(--landing-ink)]/55 uppercase">
                Mar 14 · 2 min read
              </div>
              <h3 className="font-display mt-2 mb-3 text-[32px] leading-tight font-extrabold tracking-tight text-[var(--landing-ink)]">
                The morning Zoe met Biscuit
              </h3>
              <p className="m-0 text-[14.5px] leading-normal text-[var(--landing-ink)]/85">
                It started, as all the best mornings do, with a tennis ball and a stranger. Zoe and her human took their
                usual route past the bakery this morning, but the park had other plans…
              </p>
              <div className="mt-[22px] flex items-center justify-between border-t border-dashed border-[rgba(20,16,14,.2)] pt-[18px]">
                <div className="flex gap-4 text-[13px] text-[var(--landing-ink)]/60">
                  <span>♥ 142</span>
                  <span>💬 22</span>
                  <span>↗ Share</span>
                </div>
                <span className="text-[13px] font-bold text-[var(--landing-primary)]">Read post →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
