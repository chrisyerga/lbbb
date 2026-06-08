import type { GenericMutationCtx } from 'convex/server'
import type { DataModel, Doc, Id } from '../_generated/dataModel'

type MutationCtx = GenericMutationCtx<DataModel>

export function defaultVisualDescriptionFromPet(pet: Doc<'pets'>) {
  if (pet.bio?.trim()) return pet.bio.trim()
  const speciesPart = pet.species ? `, a ${pet.species}` : ''
  const breedPart = pet.breed ? ` (${pet.breed})` : ''
  return `${pet.name}${speciesPart}${breedPart}.`
}

async function nextSortOrder(ctx: MutationCtx, ownerUserId: Id<'users'>) {
  const members = await ctx.db
    .query('castMembers')
    .withIndex('by_owner', (q) => q.eq('ownerUserId', ownerUserId))
    .collect()
  const max = members.reduce((n, m) => Math.max(n, m.sortOrder), 0)
  return max + 10
}

export async function syncCastMemberFromPet(ctx: MutationCtx, pet: Doc<'pets'>): Promise<Id<'castMembers'>> {
  const existing = await ctx.db
    .query('castMembers')
    .withIndex('by_linked_pet', (q) => q.eq('linkedPetId', pet._id))
    .first()

  const now = Date.now()
  const patch = {
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    avatarAssetId: pet.avatarAssetId,
    relatedPetIds: existing?.relatedPetIds ?? [],
    updatedAt: now,
  }

  if (existing) {
    const updates: typeof patch & { visualDescription?: string } = { ...patch }
    if (!existing.visualDescription.trim()) {
      updates.visualDescription = defaultVisualDescriptionFromPet(pet)
    }
    await ctx.db.patch(existing._id, updates)
    return existing._id
  }

  return await ctx.db.insert('castMembers', {
    ownerUserId: pet.ownerUserId,
    linkedPetId: pet._id,
    name: pet.name,
    aliases: [],
    kind: 'pet',
    relatedPetIds: [],
    species: pet.species,
    breed: pet.breed,
    visualDescription: defaultVisualDescriptionFromPet(pet),
    referenceAssetIds: [],
    avatarAssetId: pet.avatarAssetId,
    sortOrder: await nextSortOrder(ctx, pet.ownerUserId),
    status: 'active',
    createdAt: now,
    updatedAt: now,
  })
}

export async function syncAllCastMembersFromPets(ctx: MutationCtx, ownerUserId: Id<'users'>) {
  const pets = await ctx.db
    .query('pets')
    .withIndex('by_owner', (q) => q.eq('ownerUserId', ownerUserId))
    .collect()

  for (const pet of pets) {
    if (pet.deletedAt !== undefined) continue
    await syncCastMemberFromPet(ctx, pet)
  }
}
