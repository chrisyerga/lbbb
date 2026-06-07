'use client'

import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react'
import { useEffect, useRef } from 'react'
import { getDevAuthCredentials, signInWithDevPassword } from '#/lib/localConvex'

/** Signs in as the configured dev user when running against a local Convex backend. */
export function DevAutoAuth() {
  const { signIn } = useAuthActions()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const started = useRef(false)

  useEffect(() => {
    const creds = getDevAuthCredentials()
    if (!creds || isLoading || isAuthenticated || started.current) return
    started.current = true
    void signInWithDevPassword(signIn, creds)
  }, [isAuthenticated, isLoading, signIn])

  return null
}
