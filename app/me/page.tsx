import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { WithdrawButton } from '@/components/withdraw-button'
import { ProfileForm } from '@/components/profile-form'
import { ReportDialog } from '@/components/report-dialog'
import { TollAIScript } from '@/components/tollai-script'
import { APPLICATION_STATUS_LABELS, TERMINAL_APPLICATION_STATUSES, isGhostingReportEligible } from '@/lib/domain/application-state'
import { REPORT_CATEGORY_LABELS, type ReportCategory } from '@/lib/config/platform'
import { JOB_STATUS_LABELS } from '@/lib/domain/job-state'
import { relativeDays, shortDate, untilDays } from '@/lib/format'
import { candidateApplications } from '@/lib/services/applications'
import { notificationsFor, savedJobsFor } from '@/lib/services/queries'
import { myReports } from '@/lib/services/reports'
import { getViewer } from '@/lib/viewer'

export const metadata: Metadata = { title: 'My applications' }

const REPORT_STATUS: Record<string, string> = { RECEIVED: 'Received', UNDER_REVIEW: 'Under review', VERIFIED: 'Verified', DISMISSED: 'Dismissed' }

export default async function CandidateDashboard() {
  const viewer = await getViewer()
  if (!viewer) redirect('/sign-in?next=/me')
  if (viewer.role === 'EMPLOYER') redirect('/employer')
  if (viewer.role === 'ADMIN') redirect('/admin')

  const [apps, saved, reports, notes] = await Promise.all([candidateApplications(viewer), savedJobsFor(viewer), myReports(viewer), notificationsFor(viewer)])

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_20rem]">
      <TollAIScript />
      <div className="flex min-w-0 flex-col gap-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">My applications</h1>
          <p className="text-sm text-muted-foreground">Every employer must take a meaningful action before the response deadline shown on each application.</p>
        </header>

        <section aria-labelledby="apps" className="flex flex-col gap-3">
          <h2 id="apps" className="sr-only">
            Applications
          </h2>
          {apps.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              You haven&apos;t applied anywhere yet. <Link href="/" className="text-primary hover:underline">Browse verified jobs</Link>.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {apps.map((a) => {
                const closed = TERMINAL_APPLICATION_STATUSES.has(a.status)
                const overdue = a.status === 'APPLICATION_RESPONSE_OVERDUE'
                const ghost = isGhostingReportEligible({ applicationStatus: a.status, slaDeadline: new Date(a.slaDeadline), jobStatus: a.jobStatus })
                return (
                  <li key={a.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <Link href={`/jobs/${a.jobId}`} className="font-medium hover:text-primary">
                          {a.jobTitle}
                        </Link>
                        <span className="text-sm text-muted-foreground">
                          {a.companyName} · applied {relativeDays(a.createdAt)} · job {JOB_STATUS_LABELS[a.jobStatus].toLowerCase()}
                        </span>
                      </div>
                      <span
                        className={`rounded-sm border px-2 py-0.5 font-mono text-xs ${overdue ? 'border-caution/50 text-caution' : a.status === 'OFFER' || a.status === 'HIRED' ? 'border-primary/50 text-primary' : 'border-border'}`}
                      >
                        {APPLICATION_STATUS_LABELS[a.status]}
                      </span>
                    </div>
                    {!closed && (
                      <p className="font-mono text-xs text-muted-foreground">
                        {overdue
                          ? `Employer response was due ${shortDate(a.slaDeadline)}`
                          : `Employer response due ${untilDays(a.slaDeadline)} (${shortDate(a.slaDeadline)})`}
                      </p>
                    )}
                    {a.lastStatusMessage && (
                      <blockquote className="border-l-2 border-primary/50 pl-3 text-pretty text-sm leading-relaxed">{a.lastStatusMessage}</blockquote>
                    )}
                    {!closed && (
                      <div className="flex flex-wrap items-start gap-3 border-t border-border pt-3">
                        <WithdrawButton applicationId={a.id} />
                        {ghost.eligible && (
                          <div className="min-w-64 flex-1">
                            <ReportDialog jobId={a.jobId} applicationId={a.id} ghostingEligible />
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="saved" className="flex flex-col gap-3">
          <h2 id="saved" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Saved jobs
          </h2>
          {saved.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing saved.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {saved.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <Link href={`/jobs/${s.id}`} className="hover:text-primary">
                    {s.title} <span className="text-muted-foreground">· {s.companyName}</span>
                  </Link>
                  <span className="font-mono text-xs text-muted-foreground">{JOB_STATUS_LABELS[s.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="reports" className="flex flex-col gap-3">
          <h2 id="reports" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            My reports
          </h2>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports filed.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {reports.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <span>
                    {REPORT_CATEGORY_LABELS[r.category as ReportCategory] ?? r.category}
                    {r.jobTitle && <span className="text-muted-foreground"> · {r.jobTitle}</span>}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{REPORT_STATUS[r.status] ?? r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Profile links</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">Prefilled when you apply. No CV, no phone number, no address.</p>
          <ProfileForm initial={{ linkedinUrl: viewer.linkedinUrl, portfolioUrl: viewer.portfolioUrl, githubUrl: viewer.githubUrl }} />
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Updates</h2>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No updates yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-md border border-border p-3 text-sm">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-pretty leading-relaxed text-muted-foreground">{n.body}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{relativeDays(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  )
}
