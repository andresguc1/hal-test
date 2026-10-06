type Week = { week: string; jobs: number; applications: number; interviews: number; offers: number; hires: number }

const SERIES = [
  { key: 'jobs', label: 'Jobs', className: 'bg-chart-2' },
  { key: 'interviews', label: 'Interviews', className: 'bg-chart-1' },
  { key: 'offers', label: 'Offers', className: 'bg-chart-3' },
  { key: 'hires', label: 'Hires', className: 'bg-chart-4' },
] as const

export function WeeklyBars({ series }: { series: Week[] }) {
  const total = series.reduce((s, w) => s + w.jobs + w.interviews + w.offers + w.hires, 0)
  if (total === 0) return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
  const max = Math.max(...series.flatMap((w) => SERIES.map((s) => w[s.key])), 1)

  return (
    <figure className="flex flex-col gap-3">
      <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Weekly jobs, interviews, offers and hires">
        {series.map((w) => (
          <div key={w.week} className="flex h-full flex-1 items-end gap-px" title={`Week of ${w.week}: ${w.jobs} jobs, ${w.interviews} interviews, ${w.offers} offers, ${w.hires} hires`}>
            {SERIES.map((s) => (
              <span key={s.key} className={`flex-1 rounded-t-[2px] ${s.className}`} style={{ height: `${(w[s.key] / max) * 100}%` }} />
            ))}
          </div>
        ))}
      </div>
      <figcaption className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-[2px] ${s.className}`} aria-hidden />
            {s.label}
          </span>
        ))}
        <span className="ml-auto font-mono">
          {series[0]?.week} → {series.at(-1)?.week}
        </span>
      </figcaption>
    </figure>
  )
}
