import 'server-only'
import { resolveTxt } from 'node:dns/promises'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { ApiError, Errors } from '@/lib/api/errors'
import { db, type Tx } from '@/lib/db'
import { applications, companies, companyMembers, jobs } from '@/lib/db/schema'
import { PLATFORM } from '@/lib/config/platform'
import { detectThirdPartyRecruiting } from '@/lib/domain/detectors'
import { ACTIVE_JOB_STATUSES } from '@/lib/domain/job-state'
import { randomToken } from '@/lib/security/hash'
import type { Viewer } from '@/lib/viewer'
import { audit, emitEvent } from './events'

const FREE_MAIL = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'icloud.com',
  'me.com', 'proton.me', 'protonmail.com', 'aol.com', 'gmx.com', 'yandex.com', 'mail.com', 'zoho.com',
])

export function registrableDomain(website: string): string {
  const host = new URL(website).hostname.toLowerCase().replace(/^www\./, '')
  return host
}

function emailDomain(email: string) {
  return email.split('@')[1]?.toLowerCase() ?? ''
}

function slugify(name: string) {
  const base = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  return `${base || 'company'}-${randomToken(3)}`
}

export async function createCompany(
  viewer: Viewer,
  input: { name: string; website: string; linkedinUrl?: string | null; description: string },
) {
  const domain = registrableDomain(input.website)
  const mailDomain = emailDomain(viewer.email)
  if (FREE_MAIL.has(mailDomain))
    throw new ApiError(422, 'CORPORATE_EMAIL_REQUIRED', 'Register with your corporate email address to create a company.')
  if (!(mailDomain === domain || mailDomain.endsWith(`.${domain}`) || domain.endsWith(`.${mailDomain}`)))
    throw new ApiError(422, 'EMAIL_DOMAIN_MISMATCH', 'Your email domain must match the company website domain.')

  const thirdParty = detectThirdPartyRecruiting(`${input.name} ${input.description}`)
  if (thirdParty.flagged || /\b(recruit(ing|ment)|staffing|headhunt|talent (?:partners|solutions))\b/i.test(input.name))
    throw new ApiError(422, 'THIRD_PARTY_RECRUITING', 'ActuallyHiring is for direct employers only. Agencies and third-party recruiters cannot register.')

  const existing = await db.select({ id: companies.id }).from(companies).where(eq(companies.domain, domain)).limit(1)
  if (existing.length) throw Errors.conflict('COMPANY_EXISTS', 'A company with this domain is already registered. Ask its owner to add you.')

  return db.transaction(async (tx) => {
    const [c] = await tx
      .insert(companies)
      .values({
        slug: slugify(input.name),
        name: input.name,
        website: `https://${domain}`,
        domain,
        linkedinUrl: input.linkedinUrl ?? null,
        description: input.description,
        verificationToken: randomToken(16),
        createdBy: viewer.userId,
        verificationEvidence: { emailDomainMatch: true, emailDomain: mailDomain },
      })
      .returning()
    await tx.insert(companyMembers).values({ companyId: c.id, userId: viewer.userId, role: 'OWNER' })
    await emitEvent(tx, { type: 'COMPANY_CREATED', idempotencyKey: `company-created:${c.id}`, companyId: c.id })
    return c
  })
}

export async function requireMembership(userId: string, companyId: string, tx: Tx | typeof db = db) {
  const [m] = await tx
    .select({ role: companyMembers.role })
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)))
    .limit(1)
  // 404 rather than 403: do not confirm the existence of other companies' resources.
  if (!m) throw Errors.notFound('Company')
  return m
}

export async function companiesForUser(userId: string) {
  return db
    .select({ company: companies, role: companyMembers.role })
    .from(companyMembers)
    .innerJoin(companies, eq(companies.id, companyMembers.companyId))
    .where(eq(companyMembers.userId, userId))
}

/**
 * Domain-control check: DNS TXT `actuallyhiring-verification=<token>` on the
 * company domain. Combined with the corporate-email match this auto-verifies;
 * otherwise the company stays PENDING for Trust & Safety review.
 */
export async function checkDomainVerification(viewer: Viewer, companyId: string) {
  await requireMembership(viewer.userId, companyId)
  const [c] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1)
  if (!c) throw Errors.notFound('Company')
  if (c.status !== 'PENDING') return { status: c.status, dnsVerified: c.status === 'VERIFIED' }

  let records: string[] = []
  try {
    records = (await resolveTxt(c.domain)).map((r) => r.join(''))
  } catch {
    records = []
  }
  const dnsVerified = records.some((r) => r.trim() === `actuallyhiring-verification=${c.verificationToken}`)
  const evidence = { ...c.verificationEvidence, dnsTxtVerified: dnsVerified, dnsCheckedAt: new Date().toISOString() }

  await db.transaction(async (tx) => {
    if (dnsVerified && c.verificationEvidence.emailDomainMatch) {
      await tx
        .update(companies)
        .set({ status: 'VERIFIED', verifiedAt: new Date(), verificationEvidence: evidence, verificationCheckedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(companies.id, c.id), eq(companies.status, 'PENDING')))
      await audit(tx, { actorId: 'SYSTEM', action: 'COMPANY_VERIFIED', targetType: 'company', targetId: c.id, reason: 'DNS TXT record and corporate email domain matched', previousState: { status: 'PENDING' }, newState: { status: 'VERIFIED' } })
      await emitEvent(tx, { type: 'COMPANY_VERIFIED', idempotencyKey: `company-verified:${c.id}`, companyId: c.id })
    } else {
      await tx.update(companies).set({ verificationEvidence: evidence, verificationCheckedAt: new Date() }).where(eq(companies.id, c.id))
    }
  })
  return { status: dnsVerified ? 'VERIFIED' : 'PENDING', dnsVerified }
}

/* ---------- Capacity (earned, never bought) ---------- */

export type CapacityTier = keyof typeof PLATFORM.capacityTiers

export async function companyCapacity(companyId: string, tx: Tx | typeof db = db) {
  const res = await tx.execute<{
    active_jobs: number
    jobs_30d: number
    completed: number
    acted_on_time: number
    due: number
  }>(sql`
    SELECT
      (SELECT count(*)::int FROM jobs WHERE company_id = ${companyId} AND status IN ${[...ACTIVE_JOB_STATUSES]}) AS active_jobs,
      (SELECT count(*)::int FROM jobs WHERE company_id = ${companyId} AND published_at > now() - interval '30 days') AS jobs_30d,
      (SELECT count(*)::int FROM jobs WHERE company_id = ${companyId} AND status IN ('HIRED','REJECTED')) AS completed,
      (SELECT count(*)::int FROM applications a JOIN jobs j ON j.id = a.job_id
         WHERE j.company_id = ${companyId}
           AND a.last_employer_action_at IS NOT NULL
           AND a.last_employer_action_at <= a.created_at + make_interval(days => j.response_sla_days)) AS acted_on_time,
      (SELECT count(*)::int FROM applications a JOIN jobs j ON j.id = a.job_id
         WHERE j.company_id = ${companyId}
           AND a.status <> 'WITHDRAWN'
           AND (a.last_employer_action_at IS NOT NULL OR a.created_at + make_interval(days => j.response_sla_days) < now())) AS due
  `)
  const r = res.rows[0]
  const slaCompliance = r.due > 0 ? r.acted_on_time / r.due : null

  let tier: CapacityTier = 'NEW'
  const p = PLATFORM.tierPromotion
  if (r.completed >= p.RELIABLE.completedProcesses && (slaCompliance ?? 0) >= p.RELIABLE.slaCompliance) tier = 'RELIABLE'
  else if (r.completed >= p.ESTABLISHED.completedProcesses && (slaCompliance ?? 0) >= p.ESTABLISHED.slaCompliance) tier = 'ESTABLISHED'

  const limits = PLATFORM.capacityTiers[tier]
  return {
    tier,
    limits,
    activeJobs: r.active_jobs,
    jobsLast30Days: r.jobs_30d,
    completedProcesses: r.completed,
    slaCompliance,
  }
}

/* ---------- Public reliability (sample-size aware) ---------- */

export async function companyReliability(companyId: string) {
  const res = await db.execute<{
    due: number
    responded: number
    on_time: number
    median_days: number | null
    closed: number
    completed: number
    cancelled: number
    reports_total: number
    reports_verified: number
    reports_review: number
    reports_dismissed: number
  }>(sql`
    WITH apps AS (
      SELECT a.*, j.response_sla_days,
        (SELECT min(h.created_at) FROM application_status_history h WHERE h.application_id = a.id AND h.actor_role = 'EMPLOYER') AS first_action
      FROM applications a JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = ${companyId} AND a.status <> 'WITHDRAWN'
    )
    SELECT
      count(*) FILTER (WHERE first_action IS NOT NULL OR created_at + make_interval(days => response_sla_days) < now())::int AS due,
      count(*) FILTER (WHERE first_action IS NOT NULL)::int AS responded,
      count(*) FILTER (WHERE first_action <= created_at + make_interval(days => response_sla_days))::int AS on_time,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM first_action - created_at) / 86400.0) FILTER (WHERE first_action IS NOT NULL) AS median_days,
      (SELECT count(*)::int FROM jobs WHERE company_id = ${companyId} AND status IN ('HIRED','REJECTED','CANCELLED')) AS closed,
      (SELECT count(*)::int FROM jobs WHERE company_id = ${companyId} AND status IN ('HIRED','REJECTED')) AS completed,
      (SELECT count(*)::int FROM jobs WHERE company_id = ${companyId} AND status = 'CANCELLED') AS cancelled,
      (SELECT count(*)::int FROM reports WHERE company_id = ${companyId}) AS reports_total,
      (SELECT count(*)::int FROM reports WHERE company_id = ${companyId} AND status = 'VERIFIED') AS reports_verified,
      (SELECT count(*)::int FROM reports WHERE company_id = ${companyId} AND status IN ('RECEIVED','UNDER_REVIEW')) AS reports_review,
      (SELECT count(*)::int FROM reports WHERE company_id = ${companyId} AND status = 'DISMISSED') AS reports_dismissed
    FROM apps
  `)
  const r = res.rows[0]
  const enough = r.due >= PLATFORM.reliabilityMinSample
  return {
    sampleSize: r.due,
    sufficientSample: enough,
    responseRate: enough ? r.responded / r.due : null,
    slaCompliance: enough ? r.on_time / r.due : null,
    medianResponseDays: enough && r.median_days != null ? Number(r.median_days) : null,
    processesClosed: r.closed,
    processCompletionRate: r.closed >= 3 ? r.completed / r.closed : null,
    cancellationRate: r.closed >= 3 ? r.cancelled / r.closed : null,
    reports: {
      total: r.reports_total,
      verified: r.reports_verified,
      underReview: r.reports_review,
      dismissed: r.reports_dismissed,
    },
  }
}

export async function companyMemberIds(companyId: string, tx: Tx | typeof db = db) {
  const rows = await tx.select({ userId: companyMembers.userId }).from(companyMembers).where(eq(companyMembers.companyId, companyId))
  return rows.map((r) => r.userId)
}

export async function isCompanyMember(userId: string, companyIds: string[]) {
  if (!companyIds.length) return false
  const rows = await db
    .select({ c: companyMembers.companyId })
    .from(companyMembers)
    .where(and(eq(companyMembers.userId, userId), inArray(companyMembers.companyId, companyIds)))
    .limit(1)
  return rows.length > 0
}

export { applications, jobs }
