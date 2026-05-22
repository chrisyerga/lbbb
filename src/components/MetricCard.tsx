export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <article className="bg-[var(--bg-raised)] p-5">
      <p className="section-label mb-2">{label}</p>
      <p className="font-display m-0 text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{detail}</p>
    </article>
  )
}
