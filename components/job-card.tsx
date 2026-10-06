import Link from 'next/link'
import { CapacityMeter } from '@/components/capacity-meter'
import { VerifiedBadge } from '@/components/verified-badge'
import { WORK_MODE_LABELS } from '@/lib/config/platform'
import { JOB_STATUS_LABELS } from '@/lib/domain/job-state'
import { formatSalary, relativeDays } from '@/lib/format'
import type { PublicJobRow } from '@/lib/services/jobs'

export function JobCard({ job }: { job: PublicJobRow }) {
  const salary = formatSalary(job)
  const accepting = job.status === 'OPEN'
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-pretty text-lg font-semibold leading-snug">
            <Link href={`/jobs/${job.id}`} className="hover:text-primary focus-visible:underline">
              {job.title}
            </Link>
          </h2>
          {!accepting && (
            <span className="shrink-0 rounded-sm border border-border px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              {JOB_STATUS_LABELS[job.status]}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href={`/companies/${job.company_id}`} className="text-foreground hover:text-primary">
            {job.company_name}
          </Link>
          <VerifiedBadge />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
        <div className="col-span-2 flex flex-col">
          <dt className="sr-only">Salary</dt>
          <dd className={salary ? 'font-mono font-medium' : 'text-muted-foreground'}>{salary ?? 'Salary not disclosed'}</dd>
        </div>
        <div className="col-span-2 flex flex-col">
          <dt className="sr-only">Location</dt>
          <dd>
            {WORK_MODE_LABELS[job.work_mode] ?? job.work_mode} — {job.location}
          </dd>
        </div>
        <div className="col-span-2 flex flex-col">
          <dt className="sr-only">Seniority and type</dt>
          <dd className="text-muted-foreground">
            {job.seniority} · {job.employment_type} · {job.category}
          </dd>
        </div>
        <div className="col-span-2 flex flex-col">
          <dt className="sr-only">Posted</dt>
          <dd className="text-muted-foreground">Posted {relativeDays(job.published_at)}</dd>
        </div>
      </dl>

      <CapacityMeter used={job.application_count} max={job.max_applications} />

      <dl className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        <div className="flex gap-1.5">
          <dt>Response SLA</dt>
          <dd className="font-mono text-foreground">{job.response_sla_days}d</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Hiring timeline</dt>
          <dd className="font-mono text-foreground">{job.hiring_timeline_days}d</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Stages</dt>
          <dd className="font-mono text-foreground">{job.hiring_stages.length}</dd>
        </div>
        {job.positions > 1 && (
          <div className="flex gap-1.5">
            <dt>Positions</dt>
            <dd className="font-mono text-foreground">{job.positions}</dd>
          </div>
        )}
      </dl>
    </article>
  )
}
