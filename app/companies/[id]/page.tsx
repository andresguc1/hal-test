import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ReliabilityPanel } from '@/components/reliability-panel'
import { VerifiedBadge } from '@/components/verified-badge'
import { JOB_STATUS_LABELS } from '@/lib/domain/job-state'
import { relativeDays } from '@/lib/format'
import { companyReliability } from '@/lib/services/companies'
import { publicJobsForCompany } from '@/lib/services/jobs'
import { getPublicCompany } from '@/lib/services/queries'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getPublicCompany((await params).id)
  return c ? { title: `${c.name} — hiring record`, description: `Verified hiring record and response metrics for ${c.name}.` } : {}
}

export default async function CompanyPage({ params }: Props) {
  const { id } = await params
  const company = await getPublicCompany(id)
  if (!company) notFound()
  const [reliability, jobs] = await Promise.all([companyReliability(company.id), publicJobsForCompany(company.id)])
  const restricted = company.status === 'SUSPENDED' || company.restriction !== 'NONE'

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_22rem]">
      <div className="flex min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-balance text-3xl font-semibold tracking-tight">{company.name}</h1>
            {company.status === 'VERIFIED' && <VerifiedBadge />}
          </div>
          <p className="max-w-prose text-pretty leading-relaxed text-muted-foreground">{company.description}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <a href={company.website} rel="noopener noreferrer nofollow" target="_blank" className="text-primary hover:underline">
              Website
            </a>
            {company.linkedinUrl && (
              <a href={company.linkedinUrl} rel="noopener noreferrer nofollow" target="_blank" className="text-primary hover:underline">
                LinkedIn
              </a>
            )}
          </div>
          {restricted && (
            <p role="status" className="rounded-md border border-caution/40 bg-caution/10 px-3 py-2 text-sm">
              New applications to this company are currently paused while existing hiring processes are resolved. Existing applications are preserved.
            </p>
          )}
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Hiring processes</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No published jobs yet.</p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {jobs.map((j) => (
                <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div className="flex flex-col gap-0.5">
                    <Link href={`/jobs/${j.id}`} className="font-medium hover:text-primary">
                      {j.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {j.seniority} · {j.location} · {j.publishedAt ? `posted ${relativeDays(j.publishedAt)}` : 'unpublished'}
                    </span>
                  </div>
                  <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-xs">{JOB_STATUS_LABELS[j.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <ReliabilityPanel companyId={company.id} reliability={reliability} />
      </aside>
    </div>
  )
}
