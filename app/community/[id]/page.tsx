import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EvidenceForm } from '@/components/evidence-form'
import { ReportDialog } from '@/components/report-dialog'
import { TollAIScript } from '@/components/tollai-script'
import { CommunityBadge } from '@/components/verified-badge'
import { WORK_MODE_LABELS } from '@/lib/config/platform'
import { relativeDays, shortDate } from '@/lib/format'
import { communitySignal, getCommunityJob, myEvidence } from '@/lib/services/community'
import { getViewer } from '@/lib/viewer'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const j = await getCommunityJob((await params).id)
  return j ? { title: `${j.title} at ${j.company_name} (community-reported)` } : {}
}

export default async function CommunityJobPage({ params }: Props) {
  const { id } = await params
  const job = await getCommunityJob(id)
  if (!job) notFound()
  const viewer = await getViewer()
  const mine = viewer ? await myEvidence(viewer, job.id) : null
  const signal = communitySignal(job)

  const evidence = [
    ['Found this job', job.found],
    ['Applied', job.applied],
    ['Got a response', job.responses],
    ['Reached interview', job.interviews],
    ['Received an offer', job.offers],
  ] as const

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_22rem]">
      {viewer && <TollAIScript />}
      <div className="flex min-w-0 flex-col gap-6">
        <Link href="/community" className="text-sm text-muted-foreground hover:text-foreground">
          ← Community jobs
        </Link>
        <div className="flex flex-col gap-3">
          <CommunityBadge />
          <h1 className="text-balance text-3xl font-semibold tracking-tight">{job.title}</h1>
          <p className="text-muted-foreground">
            {job.company_name}
            {job.location ? ` · ${job.work_mode ? `${WORK_MODE_LABELS[job.work_mode]} — ` : ''}${job.location}` : ''}
            {job.seniority ? ` · ${job.seniority}` : ''}
          </p>
        </div>
        <p className="rounded-md border border-dashed border-border p-4 text-pretty text-sm leading-relaxed text-muted-foreground">
          This listing was submitted by candidates who found it on {job.source}. {job.company_name} has not published it on ActuallyHiring, and the
          details below have not been confirmed by the company.
        </p>
        <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
          <Item label="Salary (as reported)" value={job.salary_text || 'Salary not disclosed'} />
          <Item label="Source published" value={job.source_published_at ? shortDate(job.source_published_at) : 'Unknown'} />
          <Item label="Added here" value={relativeDays(job.created_at)} />
        </dl>
        {job.technologies.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {job.technologies.map((t) => (
              <li key={t} className="rounded-sm bg-secondary px-2 py-1 font-mono text-xs">
                {t}
              </li>
            ))}
          </ul>
        )}
        <a href={job.normalized_url} rel="noopener noreferrer nofollow ugc" target="_blank" className="self-start text-sm text-primary hover:underline">
          View original posting on {job.source} ↗
        </a>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">What the community reports</h2>
          <dl className="flex flex-col gap-2">
            {evidence.map(([label, v]) => (
              <div key={label} className="flex justify-between text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-mono">{v}</dd>
              </div>
            ))}
          </dl>
          {signal && <p className="border-t border-border pt-3 text-sm text-caution">{signal}</p>}
          <p className="text-xs text-muted-foreground">Counts include only established accounts in good standing, one per person.</p>
        </section>
        {viewer?.role === 'CANDIDATE' ? (
          <EvidenceForm communityJobId={job.id} initial={mine ? { applied: mine.applied, appliedOn: mine.appliedOn, outcome: mine.outcome } : null} />
        ) : !viewer ? (
          <Link href={`/sign-in?next=/community/${job.id}`} className="text-sm text-primary hover:underline">
            Sign in to add your experience
          </Link>
        ) : null}
        {viewer && <ReportDialog communityJobId={job.id} ghostingEligible={false} />}
      </aside>
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
