import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '#/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export function buttonClassName(variant: ButtonVariant = 'primary', className?: string) {
  return cn(
    'btn inline-flex items-center justify-center px-4 py-2 text-sm font-semibold no-underline transition disabled:cursor-not-allowed disabled:opacity-50',
    variant === 'primary' &&
      'btn-primary border border-[var(--accent)] bg-[var(--accent)] text-white hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] hover:text-white',
    variant === 'secondary' &&
      'btn-secondary border border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-primary)] hover:border-[var(--accent)]',
    variant === 'ghost' && 'border border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]',
    className,
  )
}

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: ButtonVariant
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />
}
