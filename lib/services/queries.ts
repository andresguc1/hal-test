import 'server-only'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auditLogs, companies, jobs, notifications, savedJobs, securityEvents, user, userProfile } from '@/lib/db/schema'
import type { Viewer } from '@/lib/viewer'

const UUID_RE = /^[0-9a-f-]{36}$/i

/** Public company profile. Only verified (or suspended, for transparency) companies are visible. */
export async function getPublicCompany(id: string) {
  if (!UUID_RE.test(id)) return null
  const [c] = await db
    .select({
      id: companies.id,
      name: companies.name,
      slug: companies.slug,
      website: companies.website,
      linkedinUrl: companies.linkedinUrl,
      description: companies.description,
      status: companies.status,
      restriction: companies.restriction,
      verifiedAt: companies.verifiedAt,
    })
    .from(companies)
    .where(and(eq(companies.id, id), inArray(companies.status, ['VERIFIED', 'SUSPENDED'])))
    .limit(1)
  return c ?? null
}

export async function isJobSaved(viewer: Viewer | null, jobId: string) {
  if (!viewer) return false
  const [row] = await db
    .select({ jobId: savedJobs.jobId })
    .from(savedJobs)
    .where(and(eq(savedJobs.userId, viewer.userId), eq(savedJobs.jobId, jobId)))
    .limit(1)
  return Boolean(row)
}

export async function savedJobsFor(viewer: Viewer) {
  return db
    .select({ id: jobs.id, title: jobs.title, status: jobs.status, companyName: companies.name, savedAt: savedJobs.createdAt })
    .from(savedJobs)
    .innerJoin(jobs, eq(jobs.id, savedJobs.jobId))
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(eq(savedJobs.userId, viewer.userId))
    .orderBy(desc(savedJobs.createdAt))
    .limit(50)
}

export async function notificationsFor(viewer: Viewer) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, viewer.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(20)
}

/* ---------- Admin (callers must already have checked role === 'ADMIN') ---------- */

export async function adminCompanies() {
  return db
    .select({
      id: companies.id,
      name: companies.name,
      domain: companies.domain,
      website: companies.website,
      status: companies.status,
      restriction: companies.restriction,
      evidence: companies.verificationEvidence,
      createdAt: companies.createdAt,
    })
    .from(companies)
    .orderBy(sql`CASE ${companies.status} WHEN 'PENDING' THEN 0 WHEN 'SUSPENDED' THEN 1 ELSE 2 END`, desc(companies.createdAt))
    .limit(100)
}

export async function adminFlaggedJobs() {
  return db
    .select({ id: jobs.id, title: jobs.title, status: jobs.status, flags: jobs.flags, companyName: companies.name, createdAt: jobs.createdAt })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(sql`cardinality(${jobs.flags}) > 0`)
    .orderBy(desc(jobs.createdAt))
    .limit(100)
}

export async function adminRestrictedUsers() {
  return db
    .select({ id: user.id, name: user.name, email: user.email, trustState: userProfile.trustState, role: userProfile.role, createdAt: user.createdAt })
    .from(userProfile)
    .innerJoin(user, eq(user.id, userProfile.userId))
    .where(sql`${userProfile.trustState} <> 'NORMAL'`)
    .orderBy(desc(userProfile.updatedAt))
    .limit(100)
}

export async function adminSecurityEvents() {
  const [recent, summary] = await Promise.all([
    db
      .select({
        id: securityEvents.id,
        type: securityEvents.type,
        path: securityEvents.path,
        method: securityEvents.method,
        decision: securityEvents.decision,
        userId: securityEvents.userId,
        ipHash: securityEvents.ipHash,
        createdAt: securityEvents.createdAt,
      })
      .from(securityEvents)
      .orderBy(desc(securityEvents.createdAt))
      .limit(100),
    db.execute<{ type: string; n: number }>(sql`
      SELECT type, count(*)::int AS n FROM security_events
      WHERE created_at > now() - interval '24 hours'
      GROUP BY type ORDER BY n DESC
    `),
  ])
  return { recent, summary: summary.rows }
}

export async function adminAuditLog() {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100)
}
