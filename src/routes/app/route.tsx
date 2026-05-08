'use client'

import {
  createFileRoute,
  Navigate,
  Outlet,
  useRouterState,
} from '@tanstack/react-router'
import { useConvexAuth } from '@convex-dev/auth/react'

export const Route = createFileRoute('/app')({
  component: AppLayout,
})

function AppLayout() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  if (isLoading) {
    return (
      <div className="page-wrap px-4 py-12 text-sm text-[var(--sea-ink-soft)]">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" search={{ redirect: pathname }} />
  }

  return <Outlet />
}
