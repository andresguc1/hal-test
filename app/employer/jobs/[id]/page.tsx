import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ApplicantRow } from '@/components/applicant-row'
import { CapacityMeter } from '@/components/capacity-meter'
import { JobStatusControl } from '@/components/job-status-control'
import { TollAIScript } from '@/components/tollai-script'
import { ApiError } from '@/lib/api/errors'
import { APPLICATION_STATUS_LABELS, allowedEmployerApplicationTransitions, type ApplicationStatus } from '@/lib/domain/application-state'
import { JOB_STATUS_LABELS, allowedEmployerJobTransitions } from '@/lib/domain/job-state'
import { formatSalary, untilDays } from '@/lib/format'
import { applicationsForJob } from '@/lib/services/applications'
import { getViewer } from '@/lib/viewer'

export const metadata: Metadata = { title: 'Hiring process' }

export default async function EmployerJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const viewer = await getViewer()
  if (!viewer) redirect(`/sign-in?next=/employer/jobs/${id}`)
  if (viewer.role !== 'EMPLOYER') notFound()
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  let data: Awaited<ReturnType<typeof applicationsForJob>>
  try {
    data = await applicationsForJob(viewer, id)
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound()
    throw err
  }
  const { job, applications } = data

  const counts = new Map<ApplicationStatus, number>()
  for (const a of applications) counts.set(a.status, (counts.get(a.status) ?? 0) + 1)
  const overdue = counts.get('APPLICATION_RESPONSE_OVERDUE') ?? 0

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <TollAIScript />
      <Link href="/employer" className="text-sm text-muted-foreground hover:text-foreground">
        ← All hiring processes
      </Link>
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-balance text-2xl font-semibold tracking-tight">{job.title}</h1>
          <p className="text-sm text-muted-foreground">
            {formatSalary({ salary_min: job.salaryMin, salary_max: job.salaryMax, salary_currency: job.salaryCurrency, salary_period: job.salaryPeriod })} · response deadline {job.responseSlaDays} days · {job.expiresAt ? `expires ${untilDays(job.expiresAt)}` : 'not published'}
          </p>
          {job.status !== 'DRAFT' && (
            <Link href={`/jobs/${job.id}`} className="text-sm text-primary hover:underline">
              View public listing
            </Link>
          )}
        </div>
        <JobStatusControl jobId={job.id} status={job.status} allowed={allowedEmployerJobTransitions(job.status)} label={JOB_STATUS_LABELS[job.status]} />
      </header>

      <section aria-label="Pipeline" className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
        <CapacityMeter used={job.applicationCount} max={job.maxApplications} size="lg" />
        <dl className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs">
          {[...counts.entries()].map(([s, n]) => (
            <div key={s} className="flex gap-1.5">
              <dt className="text-muted-foreground">{APPLICATION_STATUS_LABELS[s]}</dt>
              <dd>{n}</dd>
            </div>
          ))}
        </dl>
        {overdue > 0 && (
          <p role="status" className="rounded-md border border-caution/40 bg-caution/10 p-3 text-sm">
            {overdue} {overdue === 1 ? 'application is' : 'applications are'} past the response deadline. Advancing, rejecting, or sending a meaningful
            status update resolves this. Simply opening a profile does not.
          </p>
        )}
      </section>

      <section aria-labelledby="applicants" className="flex flex-col gap-3">
        <h2 id="applicants" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Applicants ({applications.length})
        </h2>
        {applications.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No applications yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {applications.map((a) => (
              <ApplicantRow
                key={a.id}
                application={{
                  id: a.id,
                  status: a.status,
                  statusLabel: APPLICATION_STATUS_LABELS[a.status],
                  candidateName: a.candidate_name,
                  linkedinUrl: a.linkedin_url,
                  portfolioUrl: a.portfolio_url,
                  githubUrl: a.github_url,
                  slaDeadline: a.sla_deadline,
                  version: a.version,
                  createdAt: a.created_at,
                }}
                transitions={allowedEmployerApplicationTransitions(a.status).map((t) => ({ value: t, label: APPLICATION_STATUS_LABELS[t] }))}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
