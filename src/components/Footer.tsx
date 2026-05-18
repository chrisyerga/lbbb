import { productName } from '#/lib/product'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer mt-16 px-4 py-6 text-[var(--text-muted)]">
      <div className="page-wrap">
        <p className="m-0 text-sm">
          &copy; {year} {productName}
        </p>
      </div>
    </footer>
  )
}
