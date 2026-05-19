'use client'

import { Link } from '@tanstack/react-router'
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'
import ThemeToggle from './ThemeToggle'
import { productShortName } from '#/lib/product'
import { api } from '#convex/_generated/api'
import { cn } from '#/lib/utils'

export default function Header() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signOut } = useAuthActions()
  const profile = useQuery(api.profiles.getMine)

  const display =
    profile?.profile?.displayName ?? profile?.user.name ?? profile?.user.email

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)] px-4">
      <nav className="page-wrap flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <Link
          to="/app"
          className="mr-2 text-sm font-bold tracking-tight text-[var(--text-primary)] no-underline hover:text-[var(--accent)]"
        >
          {productShortName}
        </Link>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            to="/app"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
            activeOptions={{ exact: true }}
          >
            Dashboard
          </Link>
          <Link
            to="/app/pets"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Pets
          </Link>
          <Link
            to="/app/admin"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Admin
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {!isLoading && isAuthenticated ? (
            <>
              <Link
                to="/app/account"
                className={cn(
                  'nav-link hidden max-w-[10rem] truncate sm:inline-flex',
                )}
                title={display ?? 'Account'}
              >
                {display ?? 'Account'}
              </Link>
              <button
                type="button"
                className="nav-link hidden cursor-pointer border-0 bg-transparent p-0 sm:inline-flex"
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            </>
          ) : !isLoading ? (
            <Link
              to="/login"
              search={{ redirect: undefined }}
              className="nav-link hidden sm:inline-flex"
            >
              Sign in
            </Link>
          ) : null}

          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
