import 'server-only'
import { desc, eq, sql } from 'drizzle-orm'
import { ApiError, Errors } from '@/lib/api/errors'
import { db } from '@/lib/db'
import { communityJobEvidence, communityJobs } from '@/lib/db/schema'
import { normalizeJobUrl, UrlRejectedError } from '@/lib/domain/url'
import type { Viewer } from '@/lib/viewer'
import { emitEvent } from './events'

export type Outcome = 'NONE' | 'RESPONSE' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'HIRED'

export function sourceFromHost(host: string): string {
  if (host.endsWith('linkedin.com')) return 'LinkedIn'
  if (host.endsWith('indeed.com')) return 'Indeed'
  if (host.endsWith('glassdoor.com')) return 'Glassdoor'
  if (host.endsWith('computrabajo.com')) return 'Computrabajo'
  if (host.endsWith('wellfound.com') || host.endsWith('angel.co')) return 'Wellfound'
  if (host.endsWith('greenhouse.io') || host.endsWith('lever.co') || host.endsWith('ashbyhq.com')) return 'Company ATS'
  return host
}

export function safeNormalize(url: string) {
  try {
    return normalizeJobUrl(url)
  } catch (err) {
    if (err instanceof UrlRejectedError)
      throw new ApiError(422, err.code, err.code === 'HTTPS_REQUIRED' ? 'Only https links are accepted.' : 'This link cannot be accepted.')
    throw err
  }
}

export async function submitCommunityJob(
  viewer: Viewer,
  input: {
    url: string
    title: string
    companyName: string
    location?: string | null
    workMode?: string | null
    seniority?: string | null
    salaryText?: string | null
    technologies: string[]
    sourcePublishedAt?: string | null
    applied: boolean
    appliedOn?: string | null
    outcome: Outcome
  },
) {
  const { url, host } = safeNormalize(input.url)

  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(communityJobs)
      .values({
        normalizedUrl: url,
        source: sourceFromHost(host),
        title: input.title,
        companyName: input.companyName,
        location: input.location ?? null,
        workMode: input.workMode ?? null,
        seniority: input.seniority ?? null,
        salaryText: input.salaryText ?? null,
        technologies: input.technologies,
        submittedBy: viewer.userId,
        sourcePublishedAt: input.sourcePublishedAt ?? null,
      })
      .onConflictDoNothing({ target: communityJobs.normalizedUrl })
      .returning({ id: communityJobs.id })

    const duplicate = inserted.length === 0
    const id = duplicate
      ? (await tx.select({ id: communityJobs.id }).from(communityJobs).where(eq(communityJobs.normalizedUrl, url)).limit(1))[0].id
      : inserted[0].id

    // One evidence row per (job, user): repeated submissions update, never stack.
    await tx
      .insert(communityJobEvidence)
      .values({ communityJobId: id, userId: viewer.userId, applied: input.applied, appliedOn: input.appliedOn ?? null, outcome: input.outcome })
      .onConflictDoUpdate({
        target: [communityJobEvidence.communityJobId, communityJobEvidence.userId],
        set: { applied: input.applied, appliedOn: input.appliedOn ?? null, outcome: input.outcome, updatedAt: new Date() },
      })

    if (!duplicate) await emitEvent(tx, { type: 'COMMUNITY_JOB_SUBMITTED', idempotencyKey: `community:${id}`, payload: { source: sourceFromHost(host) } })
    return { id, duplicate }
  })
}

export async function updateEvidence(viewer: Viewer, communityJobId: string, input: { applied: boolean; appliedOn?: string | null; outcome: Outcome }) {
  const [cj] = await db.select({ id: communityJobs.id }).from(communityJobs).where(eq(communityJobs.id, communityJobId)).limit(1)
  if (!cj) throw Errors.notFound('Community job')
  await db
    .insert(communityJobEvidence)
    .values({ communityJobId, userId: viewer.userId, ...input, appliedOn: input.appliedOn ?? null })
    .onConflictDoUpdate({
      target: [communityJobEvidence.communityJobId, communityJobEvidence.userId],
      set: { applied: input.applied, appliedOn: input.appliedOn ?? null, outcome: input.outcome, updatedAt: new Date() },
    })
  return { ok: true }
}

/**
 * Community signal counts include only established accounts (≥24h old,
 * NORMAL standing) so a burst of new accounts cannot manufacture consensus.
 */
const EVIDENCE_AGG = sql.raw(`
  count(e.user_id) AS found,
  count(e.user_id) FILTER (WHERE e.applied) AS applied,
  count(e.user_id) FILTER (WHERE e.outcome IN ('RESPONSE','INTERVIEW','OFFER','REJECTED','HIRED')) AS responses,
  count(e.user_id) FILTER (WHERE e.outcome IN ('INTERVIEW','OFFER','HIRED')) AS interviews,
  count(e.user_id) FILTER (WHERE e.outcome IN ('OFFER','HIRED')) AS offers
`)

export type CommunityJobRow = {
  id: string
  title: string
  company_name: string
  location: string | null
  work_mode: string | null
  seniority: string | null
  salary_text: string | null
  technologies: string[]
  source: string
  status: string
  normalized_url: string
  created_at: string
  source_published_at: string | null
  found: number
  applied: number
  responses: number
  interviews: number
  offers: number
}

const EVIDENCE_JOIN = sql.raw(`
  LEFT JOIN (
    community_job_evidence e
    JOIN "user" u ON u.id = e.user_id AND u."createdAt" < now() - interval '24 hours'
    JOIN user_profile p ON p.user_id = e.user_id AND p.trust_state = 'NORMAL'
  ) ON e.community_job_id = cj.id
`)

export async function listCommunityJobs(q?: string) {
  const like = q ? `%${q.replace(/[%_\\]/g, (m) => `\\${m}`).slice(0, 80)}%` : null
  const res = await db.execute<CommunityJobRow>(sql`
    SELECT cj.id, cj.title, cj.company_name, cj.location, cj.work_mode, cj.seniority, cj.salary_text,
           cj.technologies, cj.source, cj.status, cj.normalized_url, cj.created_at, cj.source_published_at, ${EVIDENCE_AGG}
    FROM community_jobs cj ${EVIDENCE_JOIN}
    WHERE cj.status NOT IN ('REMOVED')
      ${like ? sql`AND (cj.title ILIKE ${like} OR cj.company_name ILIKE ${like})` : sql``}
    GROUP BY cj.id
    ORDER BY cj.created_at DESC
    LIMIT 50
  `)
  return res.rows.map(normalizeCounts)
}

export async function getCommunityJob(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const res = await db.execute<CommunityJobRow>(sql`
    SELECT cj.id, cj.title, cj.company_name, cj.location, cj.work_mode, cj.seniority, cj.salary_text,
           cj.technologies, cj.source, cj.status, cj.normalized_url, cj.created_at, cj.source_published_at, ${EVIDENCE_AGG}
    FROM community_jobs cj ${EVIDENCE_JOIN}
    WHERE cj.id = ${id} AND cj.status <> 'REMOVED'
    GROUP BY cj.id
  `)
  return res.rows[0] ? normalizeCounts(res.rows[0]) : null
}

function normalizeCounts(r: CommunityJobRow): CommunityJobRow {
  return { ...r, found: Number(r.found), applied: Number(r.applied), responses: Number(r.responses), interviews: Number(r.interviews), offers: Number(r.offers) }
}

/** Neutral wording only. Never "fake job". */
export function communitySignal(r: Pick<CommunityJobRow, 'applied' | 'responses' | 'interviews' | 'created_at'>): string | null {
  const days = (Date.now() - new Date(r.created_at).getTime()) / 86_400_000
  if (r.applied >= 10 && r.responses === 0 && days >= 30) return 'Low hiring activity reported by the community.'
  if (r.interviews >= 3) return 'Community members reported reaching interviews.'
  return null
}

export async function myEvidence(viewer: Viewer, communityJobId: string) {
  const [row] = await db
    .select()
    .from(communityJobEvidence)
    .where(sql`${communityJobEvidence.communityJobId} = ${communityJobId} AND ${communityJobEvidence.userId} = ${viewer.userId}`)
    .limit(1)
  return row ?? null
}

export { desc }
