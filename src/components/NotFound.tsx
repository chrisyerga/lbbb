import { Link, useRouterState } from '@tanstack/react-router'
import { buttonClassName } from '#/components/ui/Button'

export function NotFound() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  return (
    <main className="page-wrap px-4 pb-12 pt-8">
      <section className="panel p-6 sm:p-8">
        <p className="section-label mb-3">404</p>
        <p className="m-0 text-6xl font-bold leading-none tracking-tight text-[var(--text-primary)] sm:text-7xl">
          Not found
        </p>
        <p className="mt-4 max-w-xl text-sm text-[var(--text-muted)]">
          That page doesn&apos;t exist or may have moved. Check the URL, or head
          back to the app.
        </p>
        {pathname ? (
          <p className="mt-4 max-w-xl border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 font-mono text-xs text-[var(--text-muted)]">
            {pathname}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--border)] pt-8">
          <Link to="/app" className={buttonClassName('primary')}>
            Back to dashboard
          </Link>
          <Link to="/app/pets" className={buttonClassName('secondary')}>
            View pets
          </Link>
        </div>
      </section>
    </main>
  )
}
