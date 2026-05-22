'use client'

import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '#/components/landing/LandingPage'
import { siteMeta } from '#/lib/siteMeta'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: siteMeta.title }],
  }),
  component: IndexRoute,
})

function IndexRoute() {
  return <LandingPage />
}
