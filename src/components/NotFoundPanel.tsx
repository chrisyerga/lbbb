import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { buttonClassName } from '#/components/ui/Button'

export type NotFoundAction = {
  label: string
  to: string
  variant?: 'primary' | 'secondary'
}

export function NotFoundPanel({
  code = '404',
  title,
  description,
  subject,
  actions,
}: {
  code?: string
  title: string
  description: ReactNode
  subject?: string
  actions: NotFoundAction[]
}) {
  return (
    <main className="page-wrap px-4 pb-12 pt-8">
      <section className="panel p-6 sm:p-8">
        <p className="section-label mb-3">{code}</p>
        <h1 className="m-0 text-4xl font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-sm text-[var(--text-muted)]">
          {description}
        </p>
        {subject ? (
          <p className="mt-4 max-w-xl border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 font-mono text-xs text-[var(--text-muted)]">
            {subject}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--border)] pt-8">
          {actions.map((action) => (
            <Link
              key={action.to + action.label}
              to={action.to}
              className={buttonClassName(action.variant ?? 'secondary')}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

export function PetBlogNotFound({ petSlug }: { petSlug: string }) {
  return (
    <NotFoundPanel
      title="No pet blog here"
      description={
        <>
          There is no public blog for{' '}
          <span className="font-semibold text-[var(--text-primary)]">
            {petSlug}
          </span>
          . The pet may not exist, the URL may be wrong, or the blog might be
          private or unlisted.
        </>
      }
      subject={`/p/${petSlug}`}
      actions={[{ label: 'Back to LBBB', to: '/app', variant: 'primary' }]}
    />
  )
}

export function PetNotFound({ petId }: { petId?: string }) {
  return (
    <NotFoundPanel
      title="Pet not found"
      description="That pet doesn't exist or you don't have access to it."
      subject={petId}
      actions={[
        { label: 'View pets', to: '/app/pets', variant: 'primary' },
        { label: 'Dashboard', to: '/app', variant: 'secondary' },
      ]}
    />
  )
}
