type Step = { label: string; value: number | null }

export function Funnel({ steps, suppressed, sample, threshold }: { steps: Step[]; suppressed: boolean; sample: number; threshold: number }) {
  if (suppressed) {
    return (
      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
        Withheld: {sample} application{sample === 1 ? '' : 's'} in this period, below the privacy threshold of {threshold}.
      </p>
    )
  }
  const top = Math.max(steps[0]?.value ?? 0, 1)
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((s, i) => {
        const v = s.value ?? 0
        const prev = i > 0 ? steps[i - 1].value ?? 0 : null
        return (
          <li key={s.label} className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3 text-sm">
            <span className="text-muted-foreground">{s.label}</span>
            <span className="h-6 overflow-hidden rounded-sm bg-secondary" aria-hidden>
              <span className="block h-full rounded-sm bg-primary" style={{ width: `${Math.max((v / top) * 100, v > 0 ? 1.5 : 0)}%` }} />
            </span>
            <span className="text-right font-mono">
              {v}
              {prev ? <span className="ml-1 text-xs text-muted-foreground">{Math.round((v / prev) * 100)}%</span> : null}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
