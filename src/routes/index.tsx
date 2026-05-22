'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useConvexAuth } from '@convex-dev/auth/react'
import { buttonClassName } from '#/components/ui/Button'
import { productName } from '#/lib/product'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: productName }],
  }),
  component: LandingPage,
})

function LandingPage() {
  const { isAuthenticated, isLoading } = useConvexAuth()

  return (
    <main className="page-wrap px-4 pb-12 pt-8">
      <section className="panel overflow-hidden p-6 sm:p-8">
        <img
          src="/images/zoe-mascot.png"
          alt="Zoe, the Cafe Zoe mascot — a friendly dog with headphones and a Wi-Fi tag"
          width={320}
          height={320}
          className="zoe-mascot-float mb-3 mr-4 block w-36 sm:mb-4 sm:mr-5 sm:w-44 lg:w-52"
        />
        <p className="m-0 text-4xl font-bold uppercase leading-none tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
          Cafe Zoe
        </p>
        <h1 className="m-0 mt-5 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:mt-6 sm:text-3xl">
          Pet stories, written and published with a little help from Zoe.
        </h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          {productName} turns your pet photos into blog posts you can review,
          edit, and share. Meet Zoe — she keeps the creative engine running
          while you stay in control.
        </p>
        <div className="clear-both mt-6 flex flex-wrap gap-3">
          {!isLoading && isAuthenticated ? (
            <>
              <Link to="/app" className={buttonClassName('primary')}>
                Open dashboard
              </Link>
              <Link to="/app/pets" className={buttonClassName('secondary')}>
                Manage pets
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              search={{ redirect: undefined }}
              className={buttonClassName('primary')}
            >
              Sign in to get started
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
