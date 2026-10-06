import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ApplyPanel } from '@/components/apply-panel'
import { CapacityMeter } from '@/components/capacity-meter'
import { ReliabilityPanel } from '@/components/reliability-panel'
import { ReportDialog } from '@/components/report-dialog'
import { SaveJobButton } from '@/components/save-job-button'
import { TollAIScript } from '@/components/tollai-script'
import { VerifiedBadge } from '@/components/verified-badge'
import { WORK_MODE_LABELS } from '@/lib/config/platform'
import { isGhostingReportEligible } from '@/lib/domain/application-state'
import { JOB_STATUS_LABELS } from '@/lib/domain/job-state'
import { formatSalary, relativeDays, shortDate } from '@/lib/format'
import { candidateApplicationForJob } from '@/lib/services/applications'
import { companyReliability } from '@/lib/services/companies'
import { getPublicJob } from '@/lib/services/jobs'
import { isJobSaved } from '@/lib/services/queries'
import { getViewer } from '@/lib/viewer'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getPublicJob((await params).id)
  return job ? { title: `${job.title} at ${job.company_name}`, description: `${job.seniority} ${job.category} role. ${formatSalary(job) ?? 'Salary not disclosed'}.` } : {}
}

export default async function JobPage({ params }: Props) {
  const { id } = await params
  const job = await getPublicJob(id)
  if (!job) notFound()

  const viewer = await getViewer()
  const [reliability, application, saved] = await Promise.all([
    companyReliability(job.company_id),
    viewer?.role === 'CANDIDATE' ? candidateApplicationForJob(viewer, job.id) : null,
    isJobSaved(viewer, job.id),
  ])
  const salary = formatSalary(job)
  const ghostingEligible = application
    ? isGhostingReportEligible({ applicationStatus: application.status, slaDeadline: application.slaDeadline, jobStatus: job.status }).eligible
    : false

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_22rem]">
      {viewer && <TollAIScript />}
      <article className="flex min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← All jobs
          </Link>
          <h1 className="text-balance text-3xl font-semibold tracking-tight">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link href={`/companies/${job.company_id}`} className="font-medium hover:text-primary">
              {job.company_name}
            </Link>
            <VerifiedBadge />
            <span className="text-muted-foreground">Posted {relativeDays(job.published_at)}</span>
            {job.status !== 'OPEN' && (
              <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-xs">{JOB_STATUS_LABELS[job.status]}</span>
            )}
          </div>
        </header>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          <Fact label="Salary" value={salary ?? 'Salary not disclosed'} mono={Boolean(salary)} muted={!salary} />
          <Fact label="Location" value={`${WORK_MODE_LABELS[job.work_mode] ?? job.work_mode} — ${job.location}`} />
          <Fact label="Seniority · Type" value={`${job.seniority} · ${job.employment_type}`} />
          <Fact label="Response commitment" value={`${job.response_sla_days} days`} mono />
          <Fact label="Hiring timeline" value={`${job.hiring_timeline_days} days`} mono />
          <Fact label="Applications close" value={shortDate(job.expires_at)} />
        </dl>

        <Section title="Hiring process">
          <ol className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
            {job.hiring_stages.map((s, i) => (
              <li key={s} className="flex items-center gap-2 text-sm">
                <span className="flex size-6 items-center justify-center rounded-sm bg-secondary font-mono text-xs">{i + 1}</span>
                <span>{s}</span>
                {i < job.hiring_stages.length - 1 && <span aria-hidden className="hidden text-muted-foreground md:inline">→</span>}
              </li>
            ))}
          </ol>
        </Section>

        <Section title="About the role">
          <p className="whitespace-pre-line text-pretty leading-relaxed text-muted-foreground">{job.description}</p>
        </Section>
        <Section title="Responsibilities">
          <p className="whitespace-pre-line text-pretty leading-relaxed text-muted-foreground">{job.responsibilities}</p>
        </Section>
        <Section title="Core requirements">
          <ul className="flex list-disc flex-col gap-1.5 pl-5 leading-relaxed text-muted-foreground">
            {job.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Section>
        {job.technologies.length > 0 && (
          <Section title="Technologies">
            <ul className="flex flex-wrap gap-2">
              {job.technologies.map((t) => (
                <li key={t} className="rounded-sm bg-secondary px-2 py-1 font-mono text-xs">
                  {t}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </article>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
          <CapacityMeter used={job.application_count} max={job.max_applications} size="lg" />
          <ApplyPanel
            jobId={job.id}
            accepting={job.status === 'OPEN'}
            jobStatusLabel={JOB_STATUS_LABELS[job.status]}
            viewer={viewer ? { role: viewer.role, linkedinUrl: viewer.linkedinUrl, portfolioUrl: viewer.portfolioUrl, githubUrl: viewer.githubUrl } : null}
            existing={application ? { status: application.status, slaDeadline: application.slaDeadline.toISOString() } : null}
            slaDays={job.response_sla_days}
          />
          {viewer?.role === 'CANDIDATE' && <SaveJobButton jobId={job.id} initiallySaved={saved} />}
        </div>
        <ReliabilityPanel companyId={job.company_id} reliability={reliability} />
        {viewer && viewer.role !== 'ADMIN' && (
          <ReportDialog jobId={job.id} applicationId={null} ghostingEligible={ghostingEligible} />
        )}
      </aside>
    </div>
  )
}

function Fact({ label, value, mono, muted }: { label: string; value: string; mono?: boolean; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-1 bg-card p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-sm ${mono ? 'font-mono' : ''} ${muted ? 'text-muted-foreground' : ''}`}>{value}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}
