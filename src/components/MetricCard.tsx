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
    <article className="island-shell rounded-3xl p-5">
      <p className="island-kicker mb-2">{label}</p>
      <p className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">{detail}</p>
    </article>
  )
}
