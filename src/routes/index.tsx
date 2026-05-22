'use client'

import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '#/components/landing/LandingPage'
import { productName } from '#/lib/product'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: `${productName} · Cafe Zoe` }],
  }),
  component: IndexRoute,
})

function IndexRoute() {
  return <LandingPage />
}
