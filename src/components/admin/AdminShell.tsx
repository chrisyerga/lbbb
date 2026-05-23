'use client'

import type { PropsWithChildren } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { LogoPaw } from '#/components/app/icons'
import '#/styles/admin-console.css'

export function AdminShell({ children }: PropsWithChildren) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  return (
    <div className="admin-console">
      <nav className="admin-nav">
        <Link to="/app/admin" className="admin-nav-brand">
          <LogoPaw size={18} fg="var(--admin-tomato)" />
          Admin · ops
        </Link>
        <Link
          to="/app/admin/jobs"
          className={
            pathname.startsWith('/app/admin/jobs')
              ? 'admin-nav-link is-active'
              : 'admin-nav-link'
          }
        >
          Jobs
        </Link>
        <Link
          to="/app/admin/moderation"
          className={
            pathname.startsWith('/app/admin/moderation')
              ? 'admin-nav-link is-active'
              : 'admin-nav-link'
          }
        >
          Moderation
        </Link>
        <Link
          to="/app/admin/narrators"
          className={
            pathname.startsWith('/app/admin/narrators')
              ? 'admin-nav-link is-active'
              : 'admin-nav-link'
          }
        >
          Narrators
        </Link>
        <Link
          to="/app/admin/art-styles"
          className={
            pathname.startsWith('/app/admin/art-styles')
              ? 'admin-nav-link is-active'
              : 'admin-nav-link'
          }
        >
          Art styles
        </Link>
        <Link
          to="/app/admin/traits"
          className={
            pathname.startsWith('/app/admin/traits')
              ? 'admin-nav-link is-active'
              : 'admin-nav-link'
          }
        >
          Traits
        </Link>
        <Link
          to="/app/admin/costs"
          className={
            pathname.startsWith('/app/admin/costs')
              ? 'admin-nav-link is-active'
              : 'admin-nav-link'
          }
        >
          Costs
        </Link>
        <Link to="/app/admin" className="admin-nav-link">
          Overview
        </Link>
        <Link to="/app" className="admin-nav-link admin-nav-spacer">
          ← App
        </Link>
      </nav>
      <div className="admin-page-body">{children}</div>
    </div>
  )
}
