import type { ReactNode } from 'react'

export function PageShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <main className="page-wrap px-4 pb-12 pt-12">
      <section className="island-shell rounded-[2rem] p-6 sm:p-8">
        <p className="island-kicker mb-3">{eyebrow}</p>
        <h1 className="display-title m-0 max-w-3xl text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          {title}
        </h1>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  )
}
