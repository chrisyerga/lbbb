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
    profile?.profile?.displayName ?? profile?.user?.name ?? profile?.user?.email

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            {productShortName}
          </Link>
        </h2>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-none sm:w-auto sm:flex-nowrap sm:pb-0">
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Home
          </Link>
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Stack
          </Link>
          <Link
            to="/app"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            App
          </Link>
          <Link
            to="/app/admin"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Admin
          </Link>
          <a href="/p/mabel-the-corgi" className="nav-link">
            Public Blog
          </a>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
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
                className="nav-link hidden border-0 bg-transparent sm:inline-flex"
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
