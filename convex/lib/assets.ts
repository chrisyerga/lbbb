import type { GenericMutationCtx, GenericQueryCtx } from 'convex/server'
import type { DataModel, Doc, Id } from '../_generated/dataModel'

type Ctx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>

const ALLOWED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

function maxUploadBytes() {
  return Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024)
}

export function assertUploadAllowed(contentType: string, byteSize: number) {
  if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(contentType)) {
    throw new Error('File type not allowed. Use JPEG, PNG, or WebP.')
  }
  if (byteSize <= 0) {
    throw new Error('File is empty.')
  }
  if (byteSize > maxUploadBytes()) {
    throw new Error(
      `File exceeds ${Math.round(maxUploadBytes() / (1024 * 1024))} MB limit.`,
    )
  }
}

export async function resolveAssetUrl(
  ctx: Ctx,
  asset: Doc<'assets'>,
): Promise<string | null> {
  if (asset.storageProvider === 'convex' && asset.storageId) {
    return await ctx.storage.getUrl(asset.storageId)
  }
  if (asset.cdnUrl) {
    return asset.cdnUrl
  }
  return null
}

export async function requirePetOwner(
  ctx: Ctx,
  petId: Id<'pets'>,
  userId: Id<'users'>,
): Promise<Doc<'pets'>> {
  const pet = await ctx.db.get(petId)
  if (!pet || pet.deletedAt !== undefined) {
    throw new Error('Pet not found')
  }
  if (pet.ownerUserId !== userId) {
    throw new Error('Not allowed')
  }
  return pet
}

export async function requireCastMemberOwner(
  ctx: Ctx,
  castMemberId: Id<'castMembers'>,
  userId: Id<'users'>,
): Promise<Doc<'castMembers'>> {
  const member = await ctx.db.get(castMemberId)
  if (!member || member.status !== 'active') {
    throw new Error('Cast member not found')
  }
  if (member.ownerUserId !== userId) {
    throw new Error('Not allowed')
  }
  return member
}

export async function requirePetAsset(
  ctx: Ctx,
  assetId: Id<'assets'>,
  petId: Id<'pets'>,
  userId: Id<'users'>,
): Promise<Doc<'assets'>> {
  const asset = await ctx.db.get(assetId)
  if (!asset) {
    throw new Error('Asset not found')
  }
  if (asset.ownerUserId !== userId) {
    throw new Error('Not allowed')
  }
  if (asset.petId !== petId) {
    throw new Error('Asset does not belong to this pet')
  }
  if (asset.kind !== 'uploaded_photo') {
    throw new Error('Only uploaded photos can be used')
  }
  return asset
}
