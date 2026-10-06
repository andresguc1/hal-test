import type { Metadata } from 'next'
import { MetricTile } from '@/components/market/metric-tile'
import { Funnel } from '@/components/market/funnel'
import { WeeklyBars } from '@/components/market/weekly-bars'
import { DistributionList } from '@/components/market/distribution-list'
import { JOB_STATUS_LABELS, type JobStatus } from '@/lib/domain/job-state'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '@/lib/domain/application-state'
import { pct } from '@/lib/format'
import { marketOverview, roleBreakdown, weeklySeries } from '@/lib/services/analytics'

export const metadata: Metadata = {
  title: 'Are companies actually hiring?',
  description: 'Public, aggregate hiring transparency for the technology job market: funnel, response times, salary disclosure, and reports.',
}
export const dynamic = 'force-dynamic'

const PERIODS = [30, 90, 365] as const

export default async function MarketPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const raw = Number((await searchParams).period)
  const period = PERIODS.includes(raw as (typeof PERIODS)[number]) ? raw : 30
  const [m, series, roles] = await Promise.all([marketOverview(period), weeklySeries(12), roleBreakdown()])
  const updated = new Date(m.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Public hiring record</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Are companies actually hiring?</h1>
          <p className="max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground">
            Aggregates of verified platform activity only. Metrics with fewer than {m.threshold} comparable records are withheld to protect
            individuals. Updated {updated}.
          </p>
        </div>
        <nav aria-label="Period" className="flex gap-1 rounded-md border border-border p-1 text-sm">
          {PERIODS.map((p) => (
            <a
              key={p}
              href={`/market?period=${p}`}
              aria-current={p === period ? 'page' : undefined}
              className="rounded-sm px-3 py-1 text-muted-foreground aria-[current=page]:bg-secondary aria-[current=page]:text-foreground"
            >
              {p === 365 ? '1 year' : `${p} days`}
            </a>
          ))}
        </nav>
      </header>

      <section aria-label="Key metrics" className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
        <MetricTile label="Active hiring processes" value={String(m.activeJobs.value ?? 0)} note="now" />
        <MetricTile label={`Jobs published`} value={String(m.jobsPublished.value ?? 0)} note={`last ${period} days`} />
        <MetricTile
          label="Median employer response"
          value={m.medianResponseDays.value != null ? `${m.medianResponseDays.value.toFixed(1)} d` : null}
          note={`n=${m.medianResponseDays.sampleSize}`}
        />
        <MetricTile label="Updates within SLA" value={m.slaCompliance.value != null ? pct(m.slaCompliance.value) : null} note={`n=${m.slaCompliance.sampleSize}`} />
        <MetricTile label="Active jobs with salary" value={m.salaryDisclosure.value != null ? pct(m.salaryDisclosure.value) : null} note={`n=${m.salaryDisclosure.sampleSize}`} />
        <MetricTile label="Jobs reaching interview" value={m.jobsReaching.interview.value != null ? pct(m.jobsReaching.interview.value) : null} note={`n=${m.jobsReaching.interview.sampleSize}`} />
        <MetricTile label="Jobs reaching offer" value={m.jobsReaching.offer.value != null ? pct(m.jobsReaching.offer.value) : null} note={`n=${m.jobsReaching.offer.sampleSize}`} />
        <MetricTile label="Verified companies" value={String(m.verifiedCompanies.value ?? 0)} note={`of ${m.verifiedCompanies.sampleSize} registered`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Hiring funnel" note={`Applications submitted in the last ${period} days, by furthest stage reached.`}>
          <Funnel
            suppressed={m.funnel.suppressed}
            sample={m.funnel.sampleSize}
            threshold={m.threshold}
            steps={[
              { label: 'Applications', value: m.funnel.applications },
              { label: 'In review', value: m.funnel.inReview },
              { label: 'Interviews', value: m.funnel.interviews },
              { label: 'Offers', value: m.funnel.offers },
              { label: 'Hires', value: m.funnel.hires },
            ]}
          />
        </Panel>
        <Panel title="Activity over time" note="Weekly counts from trusted server-side events. Last 12 weeks.">
          <WeeklyBars series={series} />
        </Panel>
        <Panel title="Jobs by lifecycle state" note="All published jobs.">
          <DistributionList
            rows={m.jobStates.map((s) => ({ label: JOB_STATUS_LABELS[s.status as JobStatus] ?? s.status, value: s.n }))}
            empty="No published jobs yet."
          />
        </Panel>
        <Panel title="Application status" note={`Applications in the last 90 days (n=${roles.applicationStatusSample}).`}>
          <DistributionList
            rows={roles.applicationStatus.map((s) => ({ label: APPLICATION_STATUS_LABELS[s.status as ApplicationStatus] ?? s.status, value: s.n }))}
            empty={`Withheld until at least ${m.threshold} applications exist.`}
          />
        </Panel>
        <Panel title="Jobs closed, by reason" note={`Last ${period} days.`}>
          <DistributionList
            rows={m.closures.map((s) => ({ label: JOB_STATUS_LABELS[s.status as JobStatus] ?? s.status, value: s.n }))}
            empty="No jobs closed in this period."
          />
        </Panel>
        <Panel title="Most mentioned technologies" note="Across jobs published in the last 90 days.">
          <DistributionList rows={roles.technologies.map((t) => ({ label: t.tech, value: t.n, mono: true }))} empty="Not enough jobs yet." />
        </Panel>
      </div>

      <Panel title="Applications per job, by role and seniority" note="Groups with fewer than 3 jobs are withheld.">
        {roles.roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough jobs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 font-normal">Role</th>
                  <th className="py-2 font-normal">Seniority</th>
                  <th className="py-2 text-right font-normal">Jobs</th>
                  <th className="py-2 text-right font-normal">Avg. applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roles.roles.map((r) => (
                  <tr key={`${r.category}-${r.seniority}`}>
                    <td className="py-2">{r.category}</td>
                    <td className="py-2">{r.seniority}</td>
                    <td className="py-2 text-right font-mono">{r.jobs}</td>
                    <td className="py-2 text-right font-mono">{r.avg_apps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Reports" note={`Last ${period} days. A report is a signal for review, not a finding.`}>
        <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          {[
            ['Received', m.reports.received],
            ['Under review', m.reports.underReview],
            ['Verified incidents', m.reports.verified],
            ['Dismissed', m.reports.dismissed],
          ].map(([label, v]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-mono text-2xl">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  )
}

function Panel({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  )
}
