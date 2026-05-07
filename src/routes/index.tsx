import { createFileRoute } from '@tanstack/react-router'
import { MetricCard } from '#/components/MetricCard'
import { productName } from '#/lib/product'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">
          AI pet journals with real cost control
        </p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Turn daily pet moments into a public blog worth revisiting.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          {productName} stores photos, memories, prompt versions, generation
          jobs, moderation decisions, and provider costs as first-class product
          data.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/app"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
          >
            Open App
          </a>
          <a
            href="/p/mabel-the-corgi"
            className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[rgba(23,58,64,0.35)]"
          >
            Example Blog Route
          </a>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Backend"
          value="Convex"
          detail="Auth, data, storage, and initial job runner."
        />
        <MetricCard
          label="Deploy"
          value="DO + Caddy"
          detail="Docker image behind automatic TLS."
        />
        <MetricCard
          label="AI"
          value="OpenAI"
          detail="OpenRouter-ready text provider boundary."
        />
        <MetricCard
          label="Costs"
          value="Tracked"
          detail="Every provider call becomes an auditable record."
        />
      </section>

      <section className="island-shell mt-8 rounded-2xl p-6">
        <p className="island-kicker mb-2">Foundation</p>
        <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
          <li>
            Semantic public routes live under <code>/p/:petSlug</code>.
          </li>
          <li>
            Generation jobs run in Convex first and can move to DO workers
            later.
          </li>
          <li>
            Prompt versions, moderation events, and cost records are preserved.
          </li>
        </ul>
      </section>
    </main>
  )
}
