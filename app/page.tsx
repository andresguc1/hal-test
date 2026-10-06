import Link from 'next/link'
import { InfoBar } from '@/components/info-bar'
import { JobCard } from '@/components/job-card'
import { JobFilters } from '@/components/job-filters'
import { searchJobs } from '@/lib/services/jobs'

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined

export default async function HomePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const values = {
    q: one(sp.q),
    category: one(sp.category),
    seniority: one(sp.seniority),
    workMode: one(sp.workMode),
    salaryOnly: one(sp.salaryOnly),
    openOnly: one(sp.openOnly),
  }
  const cursor = one(sp.cursor)
  const { jobs, nextCursor } = await searchJobs({
    ...values,
    salaryOnly: values.salaryOnly === '1',
    openOnly: values.openOnly === '1',
    cursor,
  })

  const nextParams = new URLSearchParams(Object.entries(values).filter((e): e is [string, string] => Boolean(e[1])))
  if (nextCursor) nextParams.set('cursor', nextCursor)

  return (
    <>
      <InfoBar />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Are they actually hiring?</h1>
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            Technology jobs from verified direct employers only. Every job shows how many applications it accepts, how quickly the
            employer has committed to respond, and how the hiring process works.
          </p>
        </header>

        <JobFilters values={values} />

        <section aria-labelledby="results-heading" className="flex flex-col gap-4">
          <h2 id="results-heading" className="sr-only">
            Jobs
          </h2>
          {jobs.length === 0 ? (
            <EmptyState filtered={Object.values(values).some(Boolean)} />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {jobs.map((j) => (
                <li key={j.id} className="relative flex">
                  <div className="flex-1">
                    <JobCard job={j} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {nextCursor && (
            <Link href={`/?${nextParams.toString()}`} className="self-center rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary">
              More jobs
            </Link>
          )}
        </section>
      </div>
    </>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-8">
      <p className="font-medium">{filtered ? 'No verified jobs match these filters.' : 'No verified jobs are open right now.'}</p>
      <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
        We only list jobs from verified direct employers. If you found a job elsewhere, you can add it to the community record so
        others can see whether that company is responding.
      </p>
      <div className="flex gap-4 text-sm">
        <Link href="/community" className="text-primary hover:underline">
          Browse community-reported jobs
        </Link>
        <Link href="/employer" className="text-primary hover:underline">
          Hiring? Publish a job
        </Link>
      </div>
    </div>
  )
}
