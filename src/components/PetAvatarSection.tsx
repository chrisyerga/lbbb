'use client'

import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import type { Id } from '#convex/_generated/dataModel'
import { api } from '#convex/_generated/api'
import { PhotoUpload } from '#/components/PhotoUpload'
import { Button } from '#/components/ui/Button'

function AvatarPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-24 w-24 items-center justify-center border border-[var(--border)] bg-[var(--bg-input)] text-2xl font-bold text-[var(--text-muted)]">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function PetAvatarSection({
  petId,
  petName,
  avatarUrl,
  avatarAssetId,
}: {
  petId: Id<'pets'>
  petName: string
  avatarUrl: string | null
  avatarAssetId?: Id<'assets'>
}) {
  const photos = useQuery(api.assets.listByPet, { petId })
  const setAvatar = useMutation(api.pets.setAvatar)
  const clearAvatar = useMutation(api.pets.clearAvatar)
  const [settingAssetId, setSettingAssetId] = useState<Id<'assets'> | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  async function chooseProfile(assetId: Id<'assets'>) {
    if (assetId === avatarAssetId) return
    setSettingAssetId(assetId)
    setError(null)
    try {
      await setAvatar({ petId, assetId })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to set profile photo',
      )
    } finally {
      setSettingAssetId(null)
    }
  }

  async function onUploaded(assetId: Id<'assets'>) {
    setError(null)
    if (!avatarAssetId) {
      await chooseProfile(assetId)
    }
  }

  return (
    <section className="panel mb-8 grid gap-4 p-6 text-sm">
      <div className="flex flex-wrap items-start gap-6">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${petName} profile`}
            className="h-24 w-24 border border-[var(--border)] object-cover"
          />
        ) : (
          <AvatarPlaceholder name={petName} />
        )}
        <div className="grid flex-1 gap-3">
          <div>
            <h2 className="m-0 text-lg font-semibold text-[var(--text-primary)]">
              Profile photo
            </h2>
            <p className="mt-1 text-[var(--text-muted)]">
              Upload photos, then choose one as the profile picture shown on the
              pets list. The first upload is selected automatically.
            </p>
          </div>
          <PhotoUpload
            petId={petId}
            label="Upload photo"
            onUploaded={(assetId) => void onUploaded(assetId)}
          />
          {avatarAssetId ? (
            <Button
              type="button"
              variant="ghost"
              className="justify-start px-0"
              onClick={() => void clearAvatar({ petId })}
            >
              Remove profile photo
            </Button>
          ) : null}
          {error ? (
            <p className="m-0 text-xs text-red-400">{error}</p>
          ) : null}
        </div>
      </div>

      {photos === undefined ? (
        <p className="text-[var(--text-muted)]">Loading photos…</p>
      ) : photos.length === 0 ? (
        <p className="text-[var(--text-muted)]">No photos uploaded yet.</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => {
            if (!photo.url) return null
            const isActive = photo.assetId === avatarAssetId
            const isSetting = settingAssetId === photo.assetId
            return (
              <li
                key={photo.assetId}
                className={`panel grid gap-2 p-2 ${
                  isActive ? 'border-[var(--accent)]' : ''
                }`}
              >
                <img
                  src={photo.url}
                  alt=""
                  draggable={false}
                  className="aspect-square w-full border border-[var(--border)] object-cover"
                />
                <Button
                  type="button"
                  variant={isActive ? 'primary' : 'secondary'}
                  className="w-full text-xs"
                  disabled={isActive || isSetting}
                  onClick={() => void chooseProfile(photo.assetId)}
                >
                  {isSetting
                    ? 'Setting…'
                    : isActive
                      ? 'Profile photo'
                      : 'Set as profile'}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
