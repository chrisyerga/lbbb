'use client'

import { useRouterState } from '@tanstack/react-router'
import { AppShell } from './AppShell'
import Footer from './Footer'
import Header from './Header'
import { isV1AppRoute } from '#/lib/v1Theme'

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })
  const isLanding = pathname === '/'
  const isAppV1 = isV1AppRoute(pathname)

  if (isLanding) {
    return <>{children}</>
  }

  if (isAppV1) {
    return (
      <AppShell>
        <Header />
        {children}
        <Footer />
      </AppShell>
    )
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
