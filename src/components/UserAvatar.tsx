import { cn } from '#/lib/utils'

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-24 w-24 text-2xl',
} as const

export function userDisplayName({
  name,
  email,
  displayName,
}: {
  name?: string | null
  email?: string | null
  displayName?: string | null
}) {
  return displayName ?? name ?? email ?? 'Account'
}

export function UserAvatar({
  imageUrl,
  name,
  size = 'sm',
  className,
}: {
  imageUrl?: string | null
  name: string
  size?: keyof typeof sizeClasses
  className?: string
}) {
  const label = name.charAt(0).toUpperCase() || '?'

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={cn(
          'shrink-0 rounded-full border-2 border-[var(--border)] object-cover',
          sizeClasses[size],
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--bg-input)] font-bold text-[var(--text-muted)]',
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {label}
    </div>
  )
}
