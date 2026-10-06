import type { Metadata } from 'next'
import Link from 'next/link'
import { CommunityBadge } from '@/components/verified-badge'
import { WORK_MODE_LABELS } from '@/lib/config/platform'
import { relativeDays } from '@/lib/format'
import { communitySignal, listCommunityJobs } from '@/lib/services/community'

export const metadata: Metadata = {
  title: 'Community-reported jobs',
  description: 'Jobs found elsewhere, with what candidates report about applying. Community signals, not official company data.',
}

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.slice(0, 80)
  const jobs = await listCommunityJobs(q)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-balance text-3xl font-semibold tracking-tight">Community-reported jobs</h1>
          <p className="max-w-prose text-pretty text-sm leading-relaxed text-muted-foreground">
            Jobs candidates found on other sites, and what happened when they applied. This is community-reported information — not
            official company data, and not an accusation.
          </p>
        </div>
        <Link href="/community/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Add a job you found
        </Link>
      </header>

      <form role="search" className="flex gap-2">
        <label htmlFor="cq" className="sr-only">
          Search community jobs
        </label>
        <input id="cq" name="q" defaultValue={q} placeholder="Title or company" className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm" />
        <button className="h-10 rounded-md border border-border px-4 text-sm hover:bg-secondary">Search</button>
      </form>

      {jobs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No community-reported jobs {q ? 'match this search' : 'yet'}.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {jobs.map((j) => {
            const signal = communitySignal(j)
            return (
              <li key={j.id} className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <Link href={`/community/${j.id}`} className="text-pretty font-medium hover:text-primary">
                      {j.title}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {j.company_name}
                      {j.location ? ` · ${j.work_mode ? `${WORK_MODE_LABELS[j.work_mode]} — ` : ''}${j.location}` : ''}
                    </span>
                  </div>
                  <CommunityBadge />
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {j.found} found · {j.applied} applied · {j.responses} responses · {j.interviews} interviews · {j.offers} offers
                </p>
                {signal && <p className="text-sm text-caution">{signal}</p>}
                <p className="text-xs text-muted-foreground">
                  Source: {j.source} · added {relativeDays(j.created_at)}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
