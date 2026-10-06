export function DistributionList({ rows, empty }: { rows: { label: string; value: number; mono?: boolean }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>
  const max = Math.max(...rows.map((r) => r.value), 1)
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,9rem)_1fr_3rem] items-center gap-3 text-sm">
          <span className={`truncate ${r.mono ? 'font-mono text-xs' : ''}`}>{r.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden>
            <span className="block h-full rounded-full bg-primary/80" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="text-right font-mono text-muted-foreground">{r.value}</span>
        </li>
      ))}
    </ul>
  )
}
