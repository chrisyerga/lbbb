import { describe, expect, it } from 'vitest'
import { petSlug, postSlug, slugify, uniqueSlug } from './slugs'

describe('slug utilities', () => {
  it('creates semantic ASCII slugs', () => {
    expect(slugify('Mabel the Corgi!')).toBe('mabel-the-corgi')
  })

  it('protects reserved pet blog slugs', () => {
    expect(petSlug('Admin')).toBe('admin-pet')
  })

  it('prefixes post slugs with the UTC date', () => {
    expect(
      postSlug('The Great Squirrel Standoff', new Date('2026-05-07T12:00:00Z')),
    ).toBe('2026-05-07-the-great-squirrel-standoff')
  })

  it('suffixes duplicate slugs', () => {
    expect(uniqueSlug('mabel', new Set(['mabel', 'mabel-2']))).toBe('mabel-3')
  })
})
