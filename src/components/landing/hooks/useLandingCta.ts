'use client'

import { useConvexAuth } from '@convex-dev/auth/react'

export function useLandingCtaTo() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  if (isLoading) return '/login'
  return isAuthenticated ? '/app' : '/login'
}

export function useLandingCtaLabel(freeLabel = 'Try for free') {
  const { isAuthenticated, isLoading } = useConvexAuth()
  if (isLoading) return freeLabel
  return isAuthenticated ? 'Open dashboard' : freeLabel
}
