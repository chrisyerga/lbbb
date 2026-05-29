import { siteMeta } from '#/lib/siteMeta'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer mt-16 px-4 py-6 text-[var(--text-muted)]">
      <div className="page-wrap flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-sm">
          &copy; {year} <span className="font-display font-extrabold text-[var(--text-primary)]">{siteMeta.name}</span>
        </p>
        <p className="font-mono m-0 text-[11px] tracking-wide uppercase opacity-70">Upload · Write · Publish</p>
      </div>
    </footer>
  )
}
