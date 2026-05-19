import { useMutation } from 'convex/react'
import { useCallback, useState } from 'react'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'
import { allowedUploadTypes, defaultQuotas } from '#/lib/product'

function validateFile(file: File) {
  if (
    !(allowedUploadTypes as readonly string[]).includes(file.type)
  ) {
    throw new Error('Use JPEG, PNG, or WebP images only.')
  }
  if (file.size > defaultQuotas.maxUploadBytes) {
    throw new Error(
      `File exceeds ${Math.round(defaultQuotas.maxUploadBytes / (1024 * 1024))} MB limit.`,
    )
  }
}

export function usePhotoUpload(petId: Id<'pets'>) {
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
  const finalizeUpload = useMutation(api.assets.finalizeUpload)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(
    async (file: File) => {
      validateFile(file)
      setUploading(true)
      setError(null)
      try {
        const uploadUrl = await generateUploadUrl({})
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        if (!response.ok) {
          throw new Error('Upload failed')
        }
        const { storageId } = (await response.json()) as {
          storageId: Id<'_storage'>
        }
        const result = await finalizeUpload({
          petId,
          storageId,
          contentType: file.type,
          byteSize: file.size,
        })
        return result
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        throw err
      } finally {
        setUploading(false)
      }
    },
    [finalizeUpload, generateUploadUrl, petId],
  )

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files)
      const results = []
      for (const file of list) {
        results.push(await uploadFile(file))
      }
      return results
    },
    [uploadFile],
  )

  return { uploadFile, uploadFiles, uploading, error, setError }
}
