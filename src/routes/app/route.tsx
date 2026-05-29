'use client'

import { createFileRoute, Navigate, Outlet, useRouterState } from '@tanstack/react-router'
import { useConvexAuth } from '@convex-dev/auth/react'
import { useMutation, useQuery } from 'convex/react'
import { useEffect } from 'react'
import { api } from '#convex/_generated/api'

export const Route = createFileRoute('/app')({
  component: AppLayout,
})

function AppLayout() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })
  const account = useQuery(api.accounts.getMine)
  const ensureAccount = useMutation(api.accounts.ensureAccount)

  useEffect(() => {
    if (isAuthenticated && account?.account === null) {
      void ensureAccount()
    }
  }, [isAuthenticated, account?.account, ensureAccount])

  if (isLoading) {
    return <div className="page-wrap px-4 py-12 text-sm text-[var(--text-muted)]">Loading…</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" search={{ redirect: pathname }} />
  }

  return <Outlet />
}
