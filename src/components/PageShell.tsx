import type { ReactNode } from 'react'

export function PageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <main className="page-wrap px-4 pb-12 pt-8">
      <section className="panel p-6 sm:p-8">
        <p className="section-label mb-3">{eyebrow}</p>
        <h1 className="font-display m-0 max-w-3xl text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-muted)]">
            {description}
          </p>
        ) : null}
        <div className="mt-8 border-t border-[var(--border)] pt-8">
          {children}
        </div>
      </section>
    </main>
  )
}
