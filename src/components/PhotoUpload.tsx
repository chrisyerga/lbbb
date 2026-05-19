'use client'

import { useRef } from 'react'
import type { Id } from '#convex/_generated/dataModel'
import { allowedUploadTypes } from '#/lib/product'
import { usePhotoUpload } from '#/lib/usePhotoUpload'
import { Button } from '#/components/ui/Button'

export function PhotoUpload({
  petId,
  onUploaded,
  multiple = false,
  label = 'Upload photo',
  disabled = false,
}: {
  petId: Id<'pets'>
  onUploaded: (assetId: Id<'assets'>, url: string | null) => void
  multiple?: boolean
  label?: string
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { uploadFile, uploadFiles, uploading, error, setError } =
    usePhotoUpload(petId)

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError(null)
    try {
      if (multiple) {
        const results = await uploadFiles(files)
        for (const result of results) {
          onUploaded(result.assetId, result.url)
        }
      } else {
        const result = await uploadFile(files[0])
        onUploaded(result.assetId, result.url)
      }
    } catch {
      // error state set in hook
    } finally {
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={allowedUploadTypes.join(',')}
        multiple={multiple}
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => void onChange(e)}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading…' : label}
      </Button>
      {error ? (
        <p className="m-0 text-xs text-red-400">{error}</p>
      ) : null}
    </div>
  )
}
