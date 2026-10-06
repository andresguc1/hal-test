import 'server-only'
import { and, eq, gt, inArray, ne, sql } from 'drizzle-orm'
import { ApiError, Errors } from '@/lib/api/errors'
import { db } from '@/lib/db'
import { companies, jobs } from '@/lib/db/schema'
import { PLATFORM } from '@/lib/config/platform'
import {
  DUPLICATE_SIMILARITY_THRESHOLD,
  detectExternalApplication,
  detectThirdPartyRecruiting,
  jaccardSimilarity,
  jobFingerprint,
} from '@/lib/domain/detectors'
import { ACTIVE_JOB_STATUSES, canTransitionJob, type JobStatus } from '@/lib/domain/job-state'
import type { Viewer } from '@/lib/viewer'
import { companyCapacity, requireMembership } from './companies'
import { audit, emitEvent } from './events'

export type JobInput = {
  title: string
  category: string
  seniority: string
  location: string
  workMode: 'REMOTE' | 'HYBRID' | 'ONSITE'
  employmentType: string
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  salaryPeriod?: 'MONTH' | 'YEAR' | null
  description: string
  responsibilities: string
  requirements: string[]
  technologies: string[]
  hiringStages: string[]
  positions: number
  maxApplications: number
  responseSlaDays: number
  hiringTimelineDays: number
  applicationDeadline?: string | null
}

function screenContent(input: JobInput, companyDomain: string) {
  const text = [input.title, input.description, input.responsibilities, ...input.requirements].join('\n')
  const tp = detectThirdPartyRecruiting(text)
  if (tp.flagged)
    throw new ApiError(422, 'THIRD_PARTY_RECRUITING', 'This posting appears to be recruiting on behalf of another company. Only direct employers may post.', { matches: tp.matches })
  const ext = detectExternalApplication(text, companyDomain)
  if (ext.flagged)
    throw new ApiError(422, 'EXTERNAL_APPLICATION_VIOLATION', 'Applications must happen on ActuallyHiring. Remove links or instructions that send candidates to external forms, ATS portals, email or messaging apps.', { findings: ext.findings })
}

export async function createJobDraft(viewer: Viewer, companyId: string, input: JobInput) {
  await requireMembership(viewer.userId, companyId)
  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1)
  if (!company) throw Errors.notFound('Company')
  if (company.status === 'REJECTED' || company.status === 'SUSPENDED')
    throw new ApiError(403, 'COMPANY_NOT_ELIGIBLE', 'This company cannot create jobs in its current state.')
  screenContent(input, company.domain)

  const cap = await companyCapacity(companyId)
  if (input.maxApplications > cap.limits.applicationsPerJobMax)
    throw Errors.invalid(`Your current capacity allows up to ${cap.limits.applicationsPerJobMax} applications per job.`)

  const [job] = await db
    .insert(jobs)
    .values({
      companyId,
      createdBy: viewer.userId,
      ...input,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      salaryCurrency: input.salaryMin ? input.salaryCurrency ?? 'USD' : null,
      salaryPeriod: input.salaryMin ? input.salaryPeriod ?? 'MONTH' : null,
      applicationDeadline: input.applicationDeadline ? new Date(input.applicationDeadline) : null,
      fingerprint: jobFingerprint({ companyId, ...input }),
    })
    .returning({ id: jobs.id })
  return job
}

/**
 * Publish = commitment. Runs under a lock on the company row so concurrent
 * publishes cannot both slip under the capacity limit.
 */
export async function publishJob(viewer: Viewer, jobId: string) {
  return db.transaction(async (tx) => {
    const [job] = await tx.select().from(jobs).where(eq(jobs.id, jobId)).for('update').limit(1)
    if (!job) throw Errors.notFound('Job')
    await requireMembership(viewer.userId, job.companyId, tx)
    if (job.status !== 'DRAFT') throw Errors.conflict('INVALID_TRANSITION', 'Only draft jobs can be published.')

    const [company] = await tx.select().from(companies).where(eq(companies.id, job.companyId)).for('update').limit(1)
    if (company.status !== 'VERIFIED')
      throw new ApiError(403, 'COMPANY_NOT_VERIFIED', 'Your company must be verified before jobs can be published.')
    const restricted =
      company.restriction !== 'NONE' && company.restriction !== 'WARNING' &&
      (!company.restrictionUntil || company.restrictionUntil > new Date())
    if (restricted)
      throw new ApiError(403, 'COMPANY_RESTRICTED', 'Publishing is restricted for this company. Resolve pending hiring processes first.')

    const cap = await companyCapacity(job.companyId, tx)
    if (cap.activeJobs >= cap.limits.maxActiveJobs)
      throw new ApiError(409, 'CAPACITY_ACTIVE_JOBS', `Active job limit reached (${cap.activeJobs}/${cap.limits.maxActiveJobs}). Close or complete a process to free capacity.`)
    if (cap.jobsLast30Days >= cap.limits.jobsPerMonth)
      throw new ApiError(409, 'CAPACITY_MONTHLY_JOBS', `Monthly job limit reached (${cap.jobsLast30Days}/${cap.limits.jobsPerMonth}).`)

    // Exact recycled posting within 60 days → blocked (cannot reset the application cap).
    const recent = await tx
      .select({ id: jobs.id, fingerprint: jobs.fingerprint, description: jobs.description, status: jobs.status })
      .from(jobs)
      .where(and(eq(jobs.companyId, job.companyId), ne(jobs.id, job.id), gt(jobs.publishedAt, sql`now() - interval '60 days'`)))
    if (recent.some((r) => r.fingerprint === job.fingerprint))
      throw new ApiError(409, 'POSSIBLE_DUPLICATE_JOB', 'An identical job was published in the last 60 days. Reopen that process instead of reposting.')

    const flags = new Set(job.flags)
    if (recent.some((r) => jaccardSimilarity(r.description, job.description) >= DUPLICATE_SIMILARITY_THRESHOLD))
      flags.add('POSSIBLE_DUPLICATE_JOB')

    const maxLifetime = new Date(Date.now() + PLATFORM.maxJobLifetimeDays * 86_400_000)
    const expiresAt = job.applicationDeadline && job.applicationDeadline < maxLifetime ? job.applicationDeadline : maxLifetime

    await tx
      .update(jobs)
      .set({ status: 'OPEN', publishedAt: new Date(), expiresAt, flags: [...flags], updatedAt: new Date(), version: sql`${jobs.version} + 1` })
      .where(eq(jobs.id, job.id))
    await emitEvent(tx, { type: 'JOB_PUBLISHED', idempotencyKey: `job-published:${job.id}`, jobId: job.id, companyId: job.companyId, payload: { category: job.category, seniority: job.seniority, salaryDisclosed: job.salaryMin != null } })
    return { id: job.id, status: 'OPEN' as const, flags: [...flags] }
  })
}

export async function transitionJob(viewer: Viewer, jobId: string, to: JobStatus, reason?: string) {
  return db.transaction(async (tx) => {
    const [job] = await tx.select().from(jobs).where(eq(jobs.id, jobId)).for('update').limit(1)
    if (!job) throw Errors.notFound('Job')
    await requireMembership(viewer.userId, job.companyId, tx)
    const from = job.status as JobStatus
    if (to === 'OPEN') throw Errors.conflict('INVALID_TRANSITION', 'Use publish to open a draft.')
    if (!canTransitionJob(from, to, 'EMPLOYER'))
      throw Errors.conflict('INVALID_TRANSITION', `A job cannot move from ${from} to ${to}.`)
    if ((to === 'CANCELLED' || to === 'PAUSED') && (!reason || reason.trim().length < 10))
      throw Errors.invalid('Explain to candidates why this process is paused or cancelled (min 10 characters).')

    await tx
      .update(jobs)
      .set({ status: to, closeReason: reason ?? job.closeReason, updatedAt: new Date(), version: sql`${jobs.version} + 1` })
      .where(eq(jobs.id, job.id))

    const type = to === 'HIRED' ? 'JOB_FILLED' : to === 'CANCELLED' ? 'JOB_CANCELLED' : 'JOB_STATUS_CHANGED'
    await emitEvent(tx, { type, idempotencyKey: `job-status:${job.id}:${job.version}:${to}`, jobId: job.id, companyId: job.companyId, payload: { from, to } })

    // Candidates are told when their process is paused or cancelled; the job's
    // own status and reason are what keep this from counting as non-response.
    if (to === 'CANCELLED' || to === 'PAUSED') {
      await tx.execute(sql`
        INSERT INTO notifications (user_id, kind, title, body, link)
        SELECT a.candidate_id, ${`JOB_${to}`}, ${`"${job.title}" was ${to === 'PAUSED' ? 'paused' : 'cancelled'}`}, ${reason ?? ''}, ${'/me/applications'}
        FROM applications a WHERE a.job_id = ${job.id} AND a.status NOT IN ('HIRED','REJECTED','WITHDRAWN')
      `)
    }
    return { id: job.id, status: to }
  })
}

/* ---------- Public reads ---------- */

export const PUBLIC_JOB_STATUSES: JobStatus[] = ['OPEN', 'APPLICATIONS_LIMIT_REACHED', 'SCREENING', 'INTERVIEWING', 'FINALISTS', 'OFFER']

export type JobFilters = {
  q?: string
  category?: string
  seniority?: string
  workMode?: string
  salaryOnly?: boolean
  openOnly?: boolean
  cursor?: string
  limit?: number
}

export async function searchJobs(f: JobFilters) {
  const limit = Math.min(Math.max(f.limit ?? 20, 1), 50)
  const statuses = f.openOnly ? ['OPEN'] : PUBLIC_JOB_STATUSES
  const conds = [
    sql`j.status IN ${[...statuses]}`,
    sql`c.status = 'VERIFIED'`,
    sql`c.restriction NOT IN ('SUSPENDED','BANNED')`,
  ]
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, (m) => `\\${m}`).slice(0, 80)}%`
    conds.push(sql`(j.title ILIKE ${like} OR c.name ILIKE ${like} OR EXISTS (SELECT 1 FROM unnest(j.technologies) t WHERE t ILIKE ${like}))`)
  }
  if (f.category) conds.push(sql`j.category = ${f.category}`)
  if (f.seniority) conds.push(sql`j.seniority = ${f.seniority}`)
  if (f.workMode) conds.push(sql`j.work_mode = ${f.workMode}`)
  if (f.salaryOnly) conds.push(sql`j.salary_min IS NOT NULL`)
  if (f.cursor) {
    const [ts, id] = f.cursor.split('_')
    if (ts && id && /^[0-9a-f-]{36}$/.test(id) && !Number.isNaN(Number(ts)))
      conds.push(sql`(j.published_at, j.id) < (to_timestamp(${Number(ts) / 1000}), ${id}::uuid)`)
  }
  const res = await db.execute<PublicJobRow>(sql`
    SELECT ${PUBLIC_JOB_COLUMNS}
    FROM jobs j JOIN companies c ON c.id = j.company_id
    WHERE ${sql.join(conds, sql` AND `)}
    ORDER BY j.published_at DESC, j.id DESC
    LIMIT ${limit + 1}
  `)
  const rows = res.rows.slice(0, limit)
  const last = rows[rows.length - 1]
  const nextCursor = res.rows.length > limit && last ? `${new Date(last.published_at).getTime()}_${last.id}` : null
  return { jobs: rows, nextCursor }
}

const PUBLIC_JOB_COLUMNS = sql.raw(`
  j.id, j.title, j.category, j.seniority, j.location, j.work_mode, j.employment_type,
  j.salary_min, j.salary_max, j.salary_currency, j.salary_period,
  j.technologies, j.positions, j.max_applications, j.application_count,
  j.response_sla_days, j.hiring_timeline_days, j.status, j.published_at, j.expires_at, j.hiring_stages,
  c.id AS company_id, c.name AS company_name, c.slug AS company_slug, c.status AS company_status
`)

export type PublicJobRow = {
  id: string
  title: string
  category: string
  seniority: string
  location: string
  work_mode: string
  employment_type: string
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  salary_period: string | null
  technologies: string[]
  positions: number
  max_applications: number
  application_count: number
  response_sla_days: number
  hiring_timeline_days: number
  status: JobStatus
  published_at: string
  expires_at: string
  hiring_stages: string[]
  company_id: string
  company_name: string
  company_slug: string
  company_status: string
}

export async function getPublicJob(jobId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return null
  const res = await db.execute<PublicJobRow & { description: string; responsibilities: string; requirements: string[]; close_reason: string | null }>(sql`
    SELECT ${PUBLIC_JOB_COLUMNS}, j.description, j.responsibilities, j.requirements, j.close_reason
    FROM jobs j JOIN companies c ON c.id = j.company_id
    WHERE j.id = ${jobId} AND j.status <> 'DRAFT' AND c.status = 'VERIFIED'
    LIMIT 1
  `)
  return res.rows[0] ?? null
}

export async function jobsForCompany(companyId: string) {
  return db
    .select()
    .from(jobs)
    .where(eq(jobs.companyId, companyId))
    .orderBy(sql`${jobs.createdAt} DESC`)
}

export async function publicJobsForCompany(companyId: string) {
  return db
    .select({ id: jobs.id, title: jobs.title, status: jobs.status, seniority: jobs.seniority, location: jobs.location, publishedAt: jobs.publishedAt })
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), inArray(jobs.status, [...ACTIVE_JOB_STATUSES, 'HIRED', 'REJECTED', 'CANCELLED', 'EXPIRED'])))
    .orderBy(sql`${jobs.publishedAt} DESC NULLS LAST`)
    .limit(50)
}

export { audit }
