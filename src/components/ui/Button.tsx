import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '#/lib/utils'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement>
> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'bg-[var(--sea-ink)] text-white hover:-translate-y-0.5 hover:bg-[var(--lagoon-deep)]',
        variant === 'secondary' &&
          'border border-[var(--line)] bg-[var(--surface-strong)] text-[var(--sea-ink)] hover:-translate-y-0.5',
        variant === 'ghost' &&
          'text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)]',
        className,
      )}
      {...props}
    />
  )
}
