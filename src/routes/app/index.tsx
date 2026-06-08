'use client'

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { AddCastSlot, CastCard } from '#/components/app/cast/CastCards'
import { IconPlus, IconSparkle, LogoPaw } from '#/components/app/icons'
import { PetPhoto } from '#/components/app/pets/PetPhoto'
import { PetRowCard } from '#/components/app/pets/PetRowCard'
import type { PetListRow } from '#/components/app/pets/PetRowCard'
import { SectionHead } from '#/components/app/SharedUi'
import { StickerBtn } from '#/components/landing/primitives/StickerBtn'
import { SunBurst } from '#/components/landing/primitives/SunBurst'
import { api } from '#convex/_generated/api'

export const Route = createFileRoute('/app/')({ component: AppDashboard })

function DashboardHeader({
  displayName,
  petCount,
  memoryCount,
  castCount,
  children,
}: {
  displayName: string
  petCount: number
  memoryCount: number
  castCount: number
  children: ReactNode
}) {
  return (
    <section className="dashboard-header-band">
      <LogoPaw
        size={240}
        fg="rgba(251,241,222,.05)"
        style={{ position: 'absolute', top: -46, right: -30, transform: 'rotate(-20deg)' }}
      />
      <SunBurst color="rgba(242,160,46,.14)" size={130} rays={14} className="dashboard-header-sun" />

      <div className="page-wrap dashboard-header-grid px-4">
        <div>
          <p className="dashboard-eyebrow">↳ Home · studio desk</p>
          <h1 className="dashboard-title">
            Welcome back,
            <br />
            <span>{displayName}.</span>
          </h1>
          <div className="dashboard-stats">
            {[
              { v: petCount, l: 'pets' },
              { v: memoryCount, l: 'memories' },
              { v: castCount, l: 'cast' },
            ].map((stat) => (
              <div key={stat.l} className="dashboard-stat">
                <span>{stat.v}</span>
                <span>{stat.l}</span>
              </div>
            ))}
          </div>
        </div>
        {children}
      </div>
    </section>
  )
}

function QuickMemory({ pets }: { pets: Array<PetListRow> }) {
  const navigate = useNavigate()
  const [selectedPetId, setSelectedPetId] = useState<string | null>(pets[0]?.pet._id ?? null)

  useEffect(() => {
    if (!selectedPetId && pets[0]) setSelectedPetId(pets[0].pet._id)
  }, [pets, selectedPetId])

  return (
    <div className="quick-memory-card">
      <p className="quick-memory-kicker">
        <IconSparkle size={14} color="var(--landing-primary)" /> Jot today&apos;s memory
      </p>
      <div className="quick-memory-pets">
        <span>for</span>
        {pets.map((row) => {
          const selected = row.pet._id === selectedPetId
          return (
            <button
              key={row.pet._id}
              type="button"
              className={selected ? 'quick-memory-pet is-selected' : 'quick-memory-pet'}
              onClick={() => setSelectedPetId(row.pet._id)}
            >
              <PetPhoto name={row.pet.name} imageUrl={row.avatarUrl} accentColor={row.pet.accentColor} size={24} />
              {row.pet.name}
            </button>
          )
        })}
      </div>
      <div className="quick-memory-input">
        <span>What happened today?</span>
        <StickerBtn
          bg="var(--landing-primary)"
          size="md"
          onClick={() => {
            if (!selectedPetId) return
            void navigate({ to: '/app/pets/$petId/memories/new', params: { petId: selectedPetId } })
          }}
          disabled={!selectedPetId}
        >
          <IconPlus size={15} stroke={2.4} /> Start
        </StickerBtn>
      </div>
    </div>
  )
}

function AppDashboard() {
  const pets = useQuery(api.pets.listMine)
  const castMembers = useQuery(api.castMembers.listMine)
  const profile = useQuery(api.profiles.getMine)
  const ensureSynced = useMutation(api.castMembers.ensureSyncedFromPets)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (synced) return
    void ensureSynced({}).then(() => setSynced(true))
  }, [ensureSynced, synced])

  const displayName = useMemo(() => {
    const name = profile?.profile?.displayName ?? profile?.user.name ?? profile?.user.email ?? 'friend'
    return name.split(/\s+/)[0] ?? name
  }, [profile])

  const memoryCount = pets?.reduce((n, row) => n + (row.memoryCount ?? 0), 0) ?? 0
  const petRows = pets ?? []
  const castRows = castMembers ?? []

  return (
    <div className="dashboard-page">
      <DashboardHeader
        displayName={displayName}
        petCount={petRows.length}
        memoryCount={memoryCount}
        castCount={castRows.length}
      >
        <QuickMemory pets={petRows} />
      </DashboardHeader>

      <main className="dashboard-main page-wrap px-4">
        <div>
          <SectionHead kicker="↳ The roster" title="Your pets" actionLabel="Manage all" to="/app/pets" />
          <div className="dashboard-pet-stack">
            {pets === undefined ? (
              <p className="text-sm text-(--text-muted)">Loading pets...</p>
            ) : petRows.length === 0 ? (
              <p className="text-sm text-(--text-muted)">Add a pet to start filing memories.</p>
            ) : (
              petRows.map((row) => <PetRowCard key={row.pet._id} row={row} variant="compact" />)
            )}
          </div>
        </div>

        <aside className="dashboard-cast-rail">
          <SectionHead kicker="↳ Friends & family" title="The cast" actionLabel="Manage all" to="/app/cast" size="sm" />
          <div className="dashboard-cast-stack">
            {castMembers === undefined ? (
              <p className="text-sm text-(--text-muted)">Loading cast...</p>
            ) : (
              <>
                {castRows.slice(0, 4).map((member) => (
                  <CastCard key={member._id} member={member} variant="compact" />
                ))}
                <AddCastSlot compact />
              </>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}
