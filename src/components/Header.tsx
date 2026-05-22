'use client'

import { Link, useRouterState } from '@tanstack/react-router'
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'
import ThemeToggle from './ThemeToggle'
import { UserAvatar, userDisplayName } from './UserAvatar'
import { productShortName } from '#/lib/product'
import { api } from '#convex/_generated/api'
import { cn } from '#/lib/utils'
import { StickerBtn } from './landing/primitives/StickerBtn'
import { isV1AppRoute } from '#/lib/v1Theme'

export default function Header() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })
  const isAppV1 = isV1AppRoute(pathname)
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signOut } = useAuthActions()
  const profile = useQuery(api.profiles.getMine)

  const display = profile
    ? userDisplayName({
        displayName: profile.profile?.displayName,
        name: profile.user.name,
        email: profile.user.email,
      })
    : 'Account'

  const imageUrl = profile?.user.image

  return (
    <header
      className={cn(
        'sticky top-0 z-50 px-4',
        isAppV1
          ? 'app-header'
          : 'border-b border-[var(--border)] bg-[var(--header-bg)]',
      )}
    >
      <nav className="page-wrap flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        {isAppV1 ? (
          <Link
            to="/app"
            className="mr-2 flex items-center gap-2.5 no-underline"
          >
            <img
              src="/favicon.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl border-2 border-[#14100E]"
            />
            <span className="font-display text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
              cafe<span className="text-[var(--accent)]">zoe</span>
            </span>
          </Link>
        ) : (
          <Link
            to="/"
            className="mr-2 text-sm font-bold tracking-tight text-[var(--text-primary)] no-underline hover:text-[var(--accent)]"
          >
            {productShortName}
          </Link>
        )}

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
                  'inline-flex items-center gap-2 no-underline hover:opacity-90',
                )}
                title={display}
              >
                <UserAvatar imageUrl={imageUrl} name={display} size="sm" />
                <span className="nav-link hidden max-w-[10rem] truncate sm:inline">
                  {display}
                </span>
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
            isAppV1 ? (
              <StickerBtn
                bg="var(--landing-primary)"
                size="md"
                to="/login"
                className="hidden sm:inline-flex"
              >
                Sign in
              </StickerBtn>
            ) : (
              <Link
                to="/login"
                search={{ redirect: undefined }}
                className="nav-link hidden sm:inline-flex"
              >
                Sign in
              </Link>
            )
          ) : null}

          {!isAppV1 && <ThemeToggle />}
        </div>
      </nav>
    </header>
  )
}
