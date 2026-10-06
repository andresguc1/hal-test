import 'server-only'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ApiError, Errors } from '@/lib/api/errors'
import { db } from '@/lib/db'
import { applicationStatusHistory, applications, companies, companyMembers, jobs } from '@/lib/db/schema'
import { PLATFORM } from '@/lib/config/platform'
import {
  canTransitionApplication,
  TERMINAL_APPLICATION_STATUSES,
  type ApplicationStatus,
} from '@/lib/domain/application-state'
import type { Viewer } from '@/lib/viewer'
import { companyMemberIds, requireMembership } from './companies'
import { emitEvent, notify } from './events'

const PG_UNIQUE_VIOLATION = '23505'
const PG_CHECK_VIOLATION = '23514'

function pgCode(err: unknown): string | undefined {
  const e = err as { code?: string; cause?: { code?: string } }
  return e?.code ?? e?.cause?.code
}

/**
 * The application-limit guarantee. Three independent layers:
 *   1. SELECT ... FOR UPDATE on the job row serialises concurrent applies.
 *   2. The conditional UPDATE (application_count < max_applications) only
 *      increments when a slot is free.
 *   3. CHECK (application_count <= max_applications) in Postgres rejects any
 *      write that would exceed the cap even if the code above were wrong.
 * UNIQUE (job_id, candidate_id) prevents duplicate applications.
 */
export async function submitApplication(
  viewer: Viewer,
  jobId: string,
  input: { linkedinUrl: string; portfolioUrl?: string | null; githubUrl?: string | null },
) {
  try {
    return await db.transaction(async (tx) => {
      const [job] = await tx.select().from(jobs).where(eq(jobs.id, jobId)).for('update').limit(1)
      if (!job) throw Errors.notFound('Job')

      const [company] = await tx.select().from(companies).where(eq(companies.id, job.companyId)).limit(1)
      if (company.status !== 'VERIFIED') throw Errors.notFound('Job')
      if (company.restriction === 'APPLICATIONS_FROZEN' || company.restriction === 'SUSPENDED' || company.restriction === 'BANNED')
        throw new ApiError(409, 'APPLICATIONS_PAUSED', 'This company is not accepting new applications while it resolves pending processes.')

      if (job.status === 'APPLICATIONS_LIMIT_REACHED')
        throw new ApiError(409, 'APPLICATIONS_LIMIT_REACHED', 'This job has reached its application limit.')
      if (job.status !== 'OPEN') throw new ApiError(409, 'JOB_NOT_OPEN', 'This job is not accepting applications.')
      if (job.expiresAt && job.expiresAt < new Date()) throw new ApiError(409, 'JOB_EXPIRED', 'This job has expired.')

      const [member] = await tx
        .select({ u: companyMembers.userId })
        .from(companyMembers)
        .where(and(eq(companyMembers.companyId, job.companyId), eq(companyMembers.userId, viewer.userId)))
        .limit(1)
      if (member) throw new ApiError(403, 'SELF_APPLICATION', 'You cannot apply to a job at your own company.')

      const bumped = await tx
        .update(jobs)
        .set({
          applicationCount: sql`${jobs.applicationCount} + 1`,
          status: sql`CASE WHEN ${jobs.applicationCount} + 1 >= ${jobs.maxApplications} THEN 'APPLICATIONS_LIMIT_REACHED' ELSE ${jobs.status} END`,
          updatedAt: new Date(),
        })
        .where(and(eq(jobs.id, job.id), sql`${jobs.applicationCount} < ${jobs.maxApplications}`))
        .returning({ count: jobs.applicationCount, status: jobs.status })
      if (bumped.length === 0) throw new ApiError(409, 'APPLICATIONS_LIMIT_REACHED', 'This job has reached its application limit.')

      const slaDeadline = new Date(Date.now() + job.responseSlaDays * 86_400_000)
      const [app] = await tx
        .insert(applications)
        .values({
          jobId: job.id,
          candidateId: viewer.userId,
          linkedinUrl: input.linkedinUrl,
          portfolioUrl: input.portfolioUrl ?? null,
          githubUrl: input.githubUrl ?? null,
          slaDeadline,
        })
        .returning({ id: applications.id, status: applications.status, slaDeadline: applications.slaDeadline })

      await tx.insert(applicationStatusHistory).values({ applicationId: app.id, fromStatus: null, toStatus: 'APPLIED', actorId: viewer.userId, actorRole: 'CANDIDATE' })
      await emitEvent(tx, { type: 'APPLICATION_SUBMITTED', idempotencyKey: `app-submitted:${app.id}`, jobId: job.id, companyId: job.companyId, applicationId: app.id, payload: { category: job.category, seniority: job.seniority } })

      if (bumped[0].status === 'APPLICATIONS_LIMIT_REACHED') {
        await emitEvent(tx, { type: 'JOB_STATUS_CHANGED', idempotencyKey: `job-limit:${job.id}`, jobId: job.id, companyId: job.companyId, payload: { from: 'OPEN', to: 'APPLICATIONS_LIMIT_REACHED' } })
        for (const uid of await companyMemberIds(job.companyId, tx))
          await notify(tx, { userId: uid, kind: 'JOB_LIMIT_REACHED', title: `"${job.title}" reached its application limit`, body: 'Review applicants to keep your response commitment.', link: `/employer/jobs/${job.id}` })
      }

      return { ...app, applicationCount: bumped[0].count, maxApplications: job.maxApplications }
    })
  } catch (err) {
    const code = pgCode(err)
    if (code === PG_UNIQUE_VIOLATION) throw Errors.conflict('ALREADY_APPLIED', 'You have already applied to this job.')
    if (code === PG_CHECK_VIOLATION) throw new ApiError(409, 'APPLICATIONS_LIMIT_REACHED', 'This job has reached its application limit.')
    throw err
  }
}

/** Employer-side load with authorization: only members of the job's company. */
async function loadForEmployer(viewer: Viewer, applicationId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) throw Errors.notFound('Application')
  const [row] = await db
    .select({ app: applications, job: jobs })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(eq(applications.id, applicationId))
    .limit(1)
  if (!row) throw Errors.notFound('Application')
  await requireMembership(viewer.userId, row.job.companyId).catch(() => {
    throw Errors.notFound('Application')
  })
  return row
}

export async function employerTransition(
  viewer: Viewer,
  applicationId: string,
  input: { to: ApplicationStatus; message?: string; expectedVersion: number },
) {
  const { app, job } = await loadForEmployer(viewer, applicationId)
  const from = app.status as ApplicationStatus
  if (!canTransitionApplication(from, input.to, 'EMPLOYER'))
    throw Errors.conflict('INVALID_TRANSITION', `An application cannot move from ${from} to ${input.to}.`)

  return db.transaction(async (tx) => {
    const terminal = TERMINAL_APPLICATION_STATUSES.has(input.to)
    const updated = await tx
      .update(applications)
      .set({
        status: input.to,
        lastEmployerActionAt: new Date(),
        lastStatusMessage: input.message ?? null,
        // A meaningful stage change restarts the response clock for the next step.
        slaDeadline: terminal ? app.slaDeadline : new Date(Date.now() + job.responseSlaDays * 86_400_000),
        updatedAt: new Date(),
        version: sql`${applications.version} + 1`,
      })
      .where(and(eq(applications.id, app.id), eq(applications.version, input.expectedVersion)))
      .returning({ version: applications.version, status: applications.status, slaDeadline: applications.slaDeadline })
    if (updated.length === 0)
      throw Errors.conflict('STALE_VERSION', 'This application changed since you loaded it. Refresh and try again.')

    await tx.insert(applicationStatusHistory).values({ applicationId: app.id, fromStatus: from, toStatus: input.to, actorId: viewer.userId, actorRole: 'EMPLOYER', message: input.message ?? null })
    await emitEvent(tx, { type: 'APPLICATION_STATUS_CHANGED', idempotencyKey: `app-status:${app.id}:${app.version}`, jobId: job.id, companyId: job.companyId, applicationId: app.id, payload: { from, to: input.to } })
    await emitEvent(tx, { type: 'EMPLOYER_RESPONSE_SENT', idempotencyKey: `employer-response:${app.id}:${app.version}`, jobId: job.id, companyId: job.companyId, applicationId: app.id })
    await notify(tx, {
      userId: app.candidateId,
      kind: 'APPLICATION_UPDATE',
      title: `Update on "${job.title}"`,
      body: input.message?.slice(0, 280) || `Your application status changed.`,
      link: '/me/applications',
    })
    return updated[0]
  })
}

/**
 * A written update without a stage change counts as meaningful action only
 * if it has substance and is not repeated indefinitely.
 */
export async function employerStatusUpdate(viewer: Viewer, applicationId: string, input: { message: string; expectedVersion: number }) {
  const { app, job } = await loadForEmployer(viewer, applicationId)
  if (TERMINAL_APPLICATION_STATUSES.has(app.status as ApplicationStatus))
    throw Errors.conflict('APPLICATION_CLOSED', 'This application is closed.')
  if (input.message.trim().length < PLATFORM.minStatusUpdateLength)
    throw Errors.invalid(`Status updates must be at least ${PLATFORM.minStatusUpdateLength} characters so candidates get real information.`)

  const [{ n }] = (
    await db.execute<{ n: number }>(sql`
      SELECT count(*)::int AS n FROM application_status_history
      WHERE application_id = ${app.id} AND actor_role = 'EMPLOYER' AND from_status = to_status
    `)
  ).rows
  const extends_ = n < PLATFORM.maxStatusUpdateExtensions

  return db.transaction(async (tx) => {
    const status = app.status === 'APPLICATION_RESPONSE_OVERDUE' ? 'REVIEWING' : app.status
    const updated = await tx
      .update(applications)
      .set({
        status,
        lastEmployerActionAt: new Date(),
        lastStatusMessage: input.message,
        slaDeadline: extends_ ? new Date(Date.now() + job.responseSlaDays * 86_400_000) : app.slaDeadline,
        updatedAt: new Date(),
        version: sql`${applications.version} + 1`,
      })
      .where(and(eq(applications.id, app.id), eq(applications.version, input.expectedVersion)))
      .returning({ version: applications.version, slaDeadline: applications.slaDeadline })
    if (updated.length === 0) throw Errors.conflict('STALE_VERSION', 'This application changed since you loaded it. Refresh and try again.')
    await tx.insert(applicationStatusHistory).values({ applicationId: app.id, fromStatus: status, toStatus: status, actorId: viewer.userId, actorRole: 'EMPLOYER', message: input.message })
    await emitEvent(tx, { type: 'EMPLOYER_RESPONSE_SENT', idempotencyKey: `employer-update:${app.id}:${app.version}`, jobId: job.id, companyId: job.companyId, applicationId: app.id })
    await notify(tx, { userId: app.candidateId, kind: 'APPLICATION_UPDATE', title: `Update on "${job.title}"`, body: input.message.slice(0, 280), link: '/me/applications' })
    return { ...updated[0], slaExtended: extends_ }
  })
}

export async function withdrawApplication(viewer: Viewer, applicationId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) throw Errors.notFound('Application')
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ app: applications, job: jobs })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .where(and(eq(applications.id, applicationId), eq(applications.candidateId, viewer.userId)))
      .for('update')
      .limit(1)
    if (!row) throw Errors.notFound('Application')
    const from = row.app.status as ApplicationStatus
    if (!canTransitionApplication(from, 'WITHDRAWN', 'CANDIDATE')) throw Errors.conflict('INVALID_TRANSITION', 'This application can no longer be withdrawn.')
    await tx
      .update(applications)
      .set({ status: 'WITHDRAWN', updatedAt: new Date(), version: sql`${applications.version} + 1` })
      .where(eq(applications.id, row.app.id))
    await tx.insert(applicationStatusHistory).values({ applicationId: row.app.id, fromStatus: from, toStatus: 'WITHDRAWN', actorId: viewer.userId, actorRole: 'CANDIDATE' })
    await emitEvent(tx, { type: 'APPLICATION_WITHDRAWN', idempotencyKey: `app-withdrawn:${row.app.id}`, jobId: row.job.id, companyId: row.job.companyId, applicationId: row.app.id })
    return { id: row.app.id, status: 'WITHDRAWN' as const }
  })
}

export async function candidateApplications(viewer: Viewer) {
  return db
    .select({
      id: applications.id,
      status: applications.status,
      slaDeadline: applications.slaDeadline,
      lastStatusMessage: applications.lastStatusMessage,
      lastEmployerActionAt: applications.lastEmployerActionAt,
      createdAt: applications.createdAt,
      jobId: jobs.id,
      jobTitle: jobs.title,
      jobStatus: jobs.status,
      companyName: companies.name,
      companySlug: companies.slug,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(eq(applications.candidateId, viewer.userId))
    .orderBy(desc(applications.createdAt))
}

export async function candidateApplicationForJob(viewer: Viewer, jobId: string) {
  const [row] = await db
    .select({ id: applications.id, status: applications.status, slaDeadline: applications.slaDeadline })
    .from(applications)
    .where(and(eq(applications.jobId, jobId), eq(applications.candidateId, viewer.userId)))
    .limit(1)
  return row ?? null
}

/** Employer view of applicants. Exposes only what the candidate submitted. */
export async function applicationsForJob(viewer: Viewer, jobId: string) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1)
  if (!job) throw Errors.notFound('Job')
  await requireMembership(viewer.userId, job.companyId).catch(() => {
    throw Errors.notFound('Job')
  })
  const res = await db.execute<{
    id: string
    status: ApplicationStatus
    linkedin_url: string
    portfolio_url: string | null
    github_url: string | null
    sla_deadline: string
    last_employer_action_at: string | null
    created_at: string
    version: number
    candidate_name: string
  }>(sql`
    SELECT a.id, a.status, a.linkedin_url, a.portfolio_url, a.github_url, a.sla_deadline,
           a.last_employer_action_at, a.created_at, a.version, u.name AS candidate_name
    FROM applications a JOIN "user" u ON u.id = a.candidate_id
    WHERE a.job_id = ${job.id}
    ORDER BY a.created_at ASC
  `)
  return { job, applications: res.rows }
}
