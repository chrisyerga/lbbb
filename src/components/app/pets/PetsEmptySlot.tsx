import { Link } from '@tanstack/react-router'

export function PetsEmptySlot() {
  return (
    <Link to="/app/pets/new" className="pets-empty-slot no-underline">
      <div className="pets-empty-slot-icon" aria-hidden>
        +
      </div>
      <div>
        <p className="font-display m-0 text-[26px] leading-none font-extrabold tracking-tight text-[var(--landing-ink)]">
          Add another pet
        </p>
        <p className="mt-1.5 mb-0 max-w-md text-sm text-[var(--landing-ink)]/60">
          Create a profile to get a public blog page and start filing memories.
        </p>
      </div>
    </Link>
  )
}
