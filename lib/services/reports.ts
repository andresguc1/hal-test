import 'server-only'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ApiError, Errors } from '@/lib/api/errors'
import { db } from '@/lib/db'
import { applications, communityJobs, companies, jobs, reports, userProfile } from '@/lib/db/schema'
import type { ReportCategory } from '@/lib/config/platform'
import { isGhostingReportEligible, type ApplicationStatus } from '@/lib/domain/application-state'
import type { Viewer } from '@/lib/viewer'
import { audit, emitEvent, notify } from './events'

/**
 * Report weight is a triage signal, never a verdict. It favours reporters
 * with first-hand evidence (an application) and established accounts, so a
 * burst of fresh accounts cannot outweigh a few real applicants.
 */
export function reportWeight(input: { hasApplication: boolean; accountAgeDays: number; trustState: string }): number {
  let w = input.hasApplication ? 1 : 0.4
  if (input.accountAgeDays < 3) w *= 0.5
  else if (input.accountAgeDays < 14) w *= 0.8
  if (input.trustState === 'WARNING') w *= 0.6
  if (input.trustState === 'LIMITED' || input.trustState === 'REVIEW_REQUIRED') w *= 0.3
  return Math.round(w * 100) / 100
}

export async function createReport(
  viewer: Viewer,
  input: { category: ReportCategory; jobId?: string | null; applicationId?: string | null; communityJobId?: string | null; description: string },
) {
  let companyId: string | null = null
  let jobId: string | null = input.jobId ?? null
  let evidence: Record<string, unknown> = {}
  let hasApplication = false

  if (input.applicationId) {
    const [row] = await db
      .select({ app: applications, job: jobs })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .where(and(eq(applications.id, input.applicationId), eq(applications.candidateId, viewer.userId)))
      .limit(1)
    if (!row) throw Errors.notFound('Application')
    hasApplication = true
    jobId = row.job.id
    companyId = row.job.companyId
    // Evidence is a server snapshot, not something the reporter can assert.
    evidence = {
      applicationId: row.app.id,
      jobId: row.job.id,
      companyId: row.job.companyId,
      applicationDate: row.app.createdAt,
      currentStage: row.app.status,
      lastEmployerAction: row.app.lastEmployerActionAt,
      slaDeadline: row.app.slaDeadline,
      lastStatusUpdate: row.app.updatedAt,
      jobState: row.job.status,
    }
    if (input.category === 'JOB_GHOSTING') {
      const el = isGhostingReportEligible({ applicationStatus: row.app.status as ApplicationStatus, slaDeadline: row.app.slaDeadline, jobStatus: row.job.status })
      if (!el.eligible)
        throw new ApiError(422, 'REPORT_NOT_ELIGIBLE', ghostingIneligibleMessage(el.reason), { reason: el.reason })
    }
  } else if (input.category === 'JOB_GHOSTING') {
    throw new ApiError(422, 'REPORT_NOT_ELIGIBLE', 'Non-response reports must reference one of your applications.')
  }

  if (jobId && !companyId) {
    const [j] = await db.select({ companyId: jobs.companyId, status: jobs.status }).from(jobs).where(eq(jobs.id, jobId)).limit(1)
    if (!j || j.status === 'DRAFT') throw Errors.notFound('Job')
    companyId = j.companyId
    evidence = { ...evidence, jobId, companyId, jobState: j.status }
  }
  if (input.communityJobId) {
    const [cj] = await db.select({ id: communityJobs.id }).from(communityJobs).where(eq(communityJobs.id, input.communityJobId)).limit(1)
    if (!cj) throw Errors.notFound('Community job')
  }
  if (!jobId && !input.communityJobId) throw Errors.invalid('A report must reference a job, application or community job.')

  const dup = await db.execute<{ id: string }>(sql`
    SELECT id FROM reports
    WHERE reporter_id = ${viewer.userId} AND category = ${input.category}
      AND coalesce(job_id::text,'') = ${jobId ?? ''}
      AND coalesce(community_job_id::text,'') = ${input.communityJobId ?? ''}
    LIMIT 1
  `)
  if (dup.rows.length) throw Errors.conflict('DUPLICATE_REPORT', 'You have already filed this report.')

  const weight = reportWeight({
    hasApplication,
    accountAgeDays: (Date.now() - viewer.accountCreatedAt.getTime()) / 86_400_000,
    trustState: viewer.trustState,
  })

  return db.transaction(async (tx) => {
    const [r] = await tx
      .insert(reports)
      .values({
        reporterId: viewer.userId,
        category: input.category,
        companyId,
        jobId,
        applicationId: input.applicationId ?? null,
        communityJobId: input.communityJobId ?? null,
        description: input.description,
        evidence,
        weight,
      })
      .returning({ id: reports.id, status: reports.status })
    await emitEvent(tx, { type: 'REPORT_RECEIVED', idempotencyKey: `report:${r.id}`, companyId, jobId, payload: { category: input.category } })
    return r
  })
}

function ghostingIneligibleMessage(reason?: string) {
  switch (reason) {
    case 'SLA_NOT_EXPIRED':
      return 'The employer still has time to respond. You can report non-response after the expected response period ends.'
    case 'APPLICATION_REJECTED':
      return 'A rejection is a response. It is not eligible for a non-response report.'
    case 'APPLICATION_WITHDRAWN':
      return 'You withdrew this application.'
    case 'JOB_PAUSED':
      return 'The employer announced a pause for this process.'
    default:
      return 'This application is not eligible for a non-response report.'
  }
}

export async function myReports(viewer: Viewer) {
  return db
    .select({ id: reports.id, category: reports.category, status: reports.status, createdAt: reports.createdAt, jobId: reports.jobId, jobTitle: jobs.title })
    .from(reports)
    .leftJoin(jobs, eq(jobs.id, reports.jobId))
    .where(eq(reports.reporterId, viewer.userId))
    .orderBy(desc(reports.createdAt))
}

/* ---------- Admin review ---------- */

export async function adminReportQueue() {
  const res = await db.execute<{
    id: string
    category: string
    status: string
    description: string
    evidence: Record<string, unknown>
    weight: number
    created_at: string
    company_id: string | null
    company_name: string | null
    job_title: string | null
    reporter_trust: string | null
    reporter_age_days: number
    company_report_count: number
    company_weight_30d: number
  }>(sql`
    SELECT r.id, r.category, r.status, r.description, r.evidence, r.weight, r.created_at,
           r.company_id, c.name AS company_name, j.title AS job_title,
           p.trust_state AS reporter_trust,
           extract(day FROM now() - u."createdAt")::int AS reporter_age_days,
           (SELECT count(*)::int FROM reports r2 WHERE r2.company_id = r.company_id) AS company_report_count,
           (SELECT coalesce(sum(weight),0)::real FROM reports r3 WHERE r3.company_id = r.company_id AND r3.created_at > now() - interval '30 days') AS company_weight_30d
    FROM reports r
    LEFT JOIN companies c ON c.id = r.company_id
    LEFT JOIN jobs j ON j.id = r.job_id
    LEFT JOIN "user" u ON u.id = r.reporter_id
    LEFT JOIN user_profile p ON p.user_id = r.reporter_id
    WHERE r.status IN ('RECEIVED','UNDER_REVIEW')
    ORDER BY company_weight_30d DESC, r.created_at ASC
    LIMIT 100
  `)
  return res.rows
}

export async function reviewReport(admin: Viewer, reportId: string, input: { status: 'UNDER_REVIEW' | 'VERIFIED' | 'DISMISSED'; note: string }) {
  return db.transaction(async (tx) => {
    const [r] = await tx.select().from(reports).where(eq(reports.id, reportId)).for('update').limit(1)
    if (!r) throw Errors.notFound('Report')
    if (r.status === 'VERIFIED' || r.status === 'DISMISSED') throw Errors.conflict('REPORT_CLOSED', 'This report has already been decided.')
    await tx
      .update(reports)
      .set({ status: input.status, reviewerId: admin.userId, reviewNote: input.note, reviewedAt: new Date() })
      .where(eq(reports.id, r.id))
    await audit(tx, { actorId: admin.userId, action: `REPORT_${input.status}`, targetType: 'report', targetId: r.id, reason: input.note, previousState: { status: r.status }, newState: { status: input.status } })
    if (input.status !== 'UNDER_REVIEW') {
      await emitEvent(tx, { type: input.status === 'VERIFIED' ? 'REPORT_VERIFIED' : 'REPORT_DISMISSED', idempotencyKey: `report-decided:${r.id}`, companyId: r.companyId, jobId: r.jobId, payload: { category: r.category } })
      await notify(tx, { userId: r.reporterId, kind: 'REPORT_DECIDED', title: 'Your report was reviewed', body: input.status === 'VERIFIED' ? 'Trust & Safety verified the issue you reported.' : 'Trust & Safety reviewed your report and did not find enough evidence to verify it.', link: '/me/reports' })
    }
    return { id: r.id, status: input.status }
  })
}

/* ---------- Enforcement (admin) ---------- */

export async function setCompanyStatus(admin: Viewer, companyId: string, input: { status?: 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'PENDING'; restriction?: string; restrictionDays?: number; reason: string }) {
  return db.transaction(async (tx) => {
    const [c] = await tx.select().from(companies).where(eq(companies.id, companyId)).for('update').limit(1)
    if (!c) throw Errors.notFound('Company')
    const next = {
      status: input.status ?? c.status,
      restriction: input.restriction ?? c.restriction,
      restrictionUntil: input.restrictionDays ? new Date(Date.now() + input.restrictionDays * 86_400_000) : input.restriction === 'NONE' ? null : c.restrictionUntil,
    }
    await tx
      .update(companies)
      .set({ ...next, verifiedAt: next.status === 'VERIFIED' && c.status !== 'VERIFIED' ? new Date() : c.verifiedAt, updatedAt: new Date() })
      .where(eq(companies.id, c.id))
    await audit(tx, { actorId: admin.userId, action: 'COMPANY_STATE_CHANGED', targetType: 'company', targetId: c.id, reason: input.reason, previousState: { status: c.status, restriction: c.restriction }, newState: next })
    if (next.status === 'VERIFIED' && c.status !== 'VERIFIED')
      await emitEvent(tx, { type: 'COMPANY_VERIFIED', idempotencyKey: `company-verified:${c.id}`, companyId: c.id })

    // Restriction never deletes applications. Active candidates are informed.
    if (next.restriction === 'APPLICATIONS_FROZEN' || next.restriction === 'SUSPENDED' || next.restriction === 'BANNED') {
      await tx.execute(sql`
        INSERT INTO notifications (user_id, kind, title, body, link)
        SELECT DISTINCT a.candidate_id, 'COMPANY_RESTRICTED', ${`${c.name} paused new applications`},
          'Your existing application is preserved. The company must resolve pending processes before accepting new applicants.', '/me/applications'
        FROM applications a JOIN jobs j ON j.id = a.job_id
        WHERE j.company_id = ${c.id} AND a.status NOT IN ('HIRED','REJECTED','WITHDRAWN')
      `)
    }
    return next
  })
}

export async function setCandidateTrust(admin: Viewer, userId: string, input: { trustState: string; reason: string }) {
  return db.transaction(async (tx) => {
    const [p] = await tx.select().from(userProfile).where(eq(userProfile.userId, userId)).for('update').limit(1)
    if (!p) throw Errors.notFound('User')
    if (p.role === 'ADMIN') throw Errors.forbidden('Admin accounts cannot be restricted here.')
    await tx.update(userProfile).set({ trustState: input.trustState, updatedAt: new Date() }).where(eq(userProfile.userId, userId))
    await audit(tx, { actorId: admin.userId, action: 'CANDIDATE_TRUST_CHANGED', targetType: 'user', targetId: userId, reason: input.reason, previousState: { trustState: p.trustState }, newState: { trustState: input.trustState } })
    await notify(tx, { userId, kind: 'ACCOUNT_STANDING', title: 'Your account standing changed', body: `Reason: ${input.reason}. You can appeal this decision from your account page.`, link: '/me' })
    return { userId, trustState: input.trustState }
  })
}
