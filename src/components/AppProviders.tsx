'use client'

import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { DevAutoAuth } from '#/components/DevAutoAuth'

export function AppProviders({ children }: { children: ReactNode }) {
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined
  const convex = useMemo(() => (convexUrl ? new ConvexReactClient(convexUrl) : null), [convexUrl])

  if (!convex) return children

  return (
    <ConvexAuthProvider client={convex}>
      <DevAutoAuth />
      {children}
    </ConvexAuthProvider>
  )
}
