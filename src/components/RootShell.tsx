'use client'

import { useRouterState } from '@tanstack/react-router'
import Footer from './Footer'
import Header from './Header'

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })
  const isLanding = pathname === '/'

  return (
    <>
      {!isLanding && <Header />}
      {children}
      {!isLanding && <Footer />}
    </>
  )
}
