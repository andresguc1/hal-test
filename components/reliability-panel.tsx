import Link from 'next/link'
import { pct } from '@/lib/format'
import type { companyReliability } from '@/lib/services/companies'

type Reliability = Awaited<ReturnType<typeof companyReliability>>

export function ReliabilityPanel({ companyId, reliability: r }: { companyId: string; reliability: Reliability }) {
  return (
    <section aria-labelledby="reliability-heading" className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <h2 id="reliability-heading" className="text-sm font-semibold">
          Hiring reliability
        </h2>
        <Link href={`/companies/${companyId}`} className="text-xs text-primary hover:underline">
          Company record
        </Link>
      </div>
      {r.sufficientSample ? (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Response rate" value={pct(r.responseRate)} />
          <Stat label="Median response" value={r.medianResponseDays != null ? `${r.medianResponseDays.toFixed(1)} d` : '—'} />
          <Stat label="Within SLA" value={pct(r.slaCompliance)} />
          <Stat label="Processes completed" value={pct(r.processCompletionRate)} />
        </dl>
      ) : (
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Not enough applications yet to publish response metrics (n={r.sampleSize}). Metrics appear once there is a meaningful sample.
        </p>
      )}
      <p className="border-t border-border pt-3 text-xs text-muted-foreground">
        Reports: <span className="font-mono text-foreground">{r.reports.total}</span> received ·{' '}
        <span className="font-mono text-foreground">{r.reports.verified}</span> verified ·{' '}
        <span className="font-mono text-foreground">{r.reports.underReview}</span> under review ·{' '}
        <span className="font-mono text-foreground">{r.reports.dismissed}</span> dismissed. A report is not proof.
      </p>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  )
}
