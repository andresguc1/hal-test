import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CapacityMeter } from '@/components/capacity-meter'
import { DomainVerifyPanel } from '@/components/domain-verify-panel'
import { TollAIScript } from '@/components/tollai-script'
import { VerifiedBadge } from '@/components/verified-badge'
import { JOB_STATUS_LABELS, TERMINAL_JOB_STATUSES } from '@/lib/domain/job-state'
import { pct, relativeDays, untilDays } from '@/lib/format'
import { companiesForUser, companyCapacity, companyReliability } from '@/lib/services/companies'
import { jobsForCompany } from '@/lib/services/jobs'
import { getViewer } from '@/lib/viewer'

export const metadata: Metadata = { title: 'Hiring' }

const STATUS_COPY: Record<string, string> = {
  PENDING: 'Pending verification',
  VERIFIED: 'Verified',
  REJECTED: 'Verification rejected',
  SUSPENDED: 'Suspended',
}

export default async function EmployerDashboard() {
  const viewer = await getViewer()
  if (!viewer) redirect('/sign-in?next=/employer')
  if (viewer.role !== 'EMPLOYER') redirect(viewer.role === 'ADMIN' ? '/admin' : '/me')

  const memberships = await companiesForUser(viewer.userId)
  if (memberships.length === 0) redirect('/employer/companies/new')
  const { company } = memberships[0]
  const [capacity, reliability, jobs] = await Promise.all([companyCapacity(company.id), companyReliability(company.id), jobsForCompany(company.id)])
  const canPost = company.status === 'VERIFIED' && company.restriction === 'NONE'

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <TollAIScript />
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
            {company.status === 'VERIFIED' ? <VerifiedBadge /> : <span className="rounded-sm border border-caution/50 px-2 py-0.5 font-mono text-xs text-caution">{STATUS_COPY[company.status]}</span>}
          </div>
          <p className="text-sm text-muted-foreground">
            {company.domain} · capacity tier <span className="font-mono">{capacity.tier}</span> — earned by completing hiring processes on time, never purchased.
          </p>
        </div>
        {canPost ? (
          <Link href={`/employer/jobs/new?company=${company.id}`} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            New job
          </Link>
        ) : null}
      </header>

      {company.status === 'PENDING' && <DomainVerifyPanel companyId={company.id} domain={company.domain} token={company.verificationToken} />}
      {company.restriction !== 'NONE' && (
        <p role="status" className="rounded-md border border-caution/40 bg-caution/10 p-4 text-sm leading-relaxed">
          Trust &amp; Safety has applied a restriction ({company.restriction.replaceAll('_', ' ').toLowerCase()}). Existing applications are preserved —
          please resolve pending processes. Restrictions can be appealed by replying to the notification you received.
        </p>
      )}

      <section aria-label="Capacity and reliability" className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
        <Stat label="Active jobs">
          <CapacityMeter used={capacity.activeJobs} max={capacity.limits.maxActiveJobs} />
        </Stat>
        <Stat label="Jobs this month">
          <CapacityMeter used={capacity.jobsLast30Days} max={capacity.limits.jobsPerMonth} />
        </Stat>
        <Stat label="Updates within SLA">
          <span className="font-mono text-xl">{capacity.slaCompliance != null ? pct(capacity.slaCompliance) : '—'}</span>
        </Stat>
        <Stat label="Completed processes">
          <span className="font-mono text-xl">{capacity.completedProcesses}</span>
        </Stat>
      </section>
      {!reliability.sufficientSample && (
        <p className="text-xs text-muted-foreground">Public reliability metrics appear once you have made decisions on enough applications.</p>
      )}

      <section aria-labelledby="jobs" className="flex flex-col gap-3">
        <h2 id="jobs" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Hiring processes
        </h2>
        {jobs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {canPost ? 'No jobs yet. Publish your first hiring process.' : 'You can publish jobs once your company is verified.'}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 font-normal">Job</th>
                  <th className="p-3 font-normal">State</th>
                  <th className="p-3 font-normal">Applications</th>
                  <th className="p-3 font-normal">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td className="p-3">
                      <Link href={`/employer/jobs/${j.id}`} className="font-medium hover:text-primary">
                        {j.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">created {relativeDays(j.createdAt)}</div>
                      {j.flags.length > 0 && <div className="font-mono text-xs text-caution">{j.flags.join(', ')}</div>}
                    </td>
                    <td className="p-3 font-mono text-xs">{JOB_STATUS_LABELS[j.status]}</td>
                    <td className="w-48 p-3">
                      <CapacityMeter used={j.applicationCount} max={j.maxApplications} />
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{TERMINAL_JOB_STATUSES.has(j.status) || !j.expiresAt ? '—' : untilDays(j.expiresAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
