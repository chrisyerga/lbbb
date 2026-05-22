'use client'

import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { DismissibleTip } from '#/components/app/DismissibleTip'
import { PetRowCard } from '#/components/app/pets/PetRowCard'
import { PetsEmptySlot } from '#/components/app/pets/PetsEmptySlot'
import { PetsListHeader } from '#/components/app/pets/PetsListHeader'
import { api } from '#convex/_generated/api'

export const Route = createFileRoute('/app/pets/')({ component: PetsPage })

function PetsPage() {
  const rows = useQuery(api.pets.listMine)

  const stats = {
    petCount: rows?.length ?? 0,
    postCount: rows?.reduce((n, r) => n + r.postCount, 0) ?? 0,
    imageCount: rows?.reduce((n, r) => n + r.imageCount, 0) ?? 0,
  }

  return (
    <>
      <PetsListHeader stats={stats} />

      <DismissibleTip
        storageKey="tip:pets-list-v1"
        title="Your pet roster"
        body="This is where you'll see all your pets — profiles, public blog URLs, and recent activity in one place."
      />

      <main className="pets-list-main">
        {rows === undefined ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        ) : rows.length === 0 ? (
          <PetsEmptySlot />
        ) : (
          <div className="pets-list-stack">
            {rows.map((row) => (
              <PetRowCard key={row.pet._id} row={row} />
            ))}
            <PetsEmptySlot />
          </div>
        )}
      </main>
    </>
  )
}
