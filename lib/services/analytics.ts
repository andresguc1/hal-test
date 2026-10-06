import 'server-only'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { PLATFORM } from '@/lib/config/platform'

const K = PLATFORM.kAnonymityThreshold

export type Metric<T = number> = {
  value: T | null
  sampleSize: number
  suppressed: boolean
}

function metric<T>(value: T | null, sampleSize: number, threshold: number = K): Metric<T> {
  const suppressed = sampleSize < threshold
  return { value: suppressed ? null : value, sampleSize, suppressed }
}

/**
 * Public hiring transparency. Every value is an aggregate over trusted
 * server-side rows; anything with fewer than K comparable records is
 * suppressed rather than shown. Raw rows never leave this module.
 */
export async function marketOverview(periodDays = 30) {
  const p = Math.min(Math.max(periodDays, 7), 365)

  const [core, funnel, response, jobStates, reports, closures] = await Promise.all([
    db.execute<{ active: number; published: number; salary_disclosed: number; active_total: number; verified_companies: number; companies_total: number }>(sql`
      SELECT
        (SELECT count(*)::int FROM jobs WHERE status IN ('OPEN','APPLICATIONS_LIMIT_REACHED','SCREENING','INTERVIEWING','FINALISTS','OFFER')) AS active,
        (SELECT count(*)::int FROM jobs WHERE published_at > now() - make_interval(days => ${p})) AS published,
        (SELECT count(*)::int FROM jobs WHERE status IN ('OPEN','APPLICATIONS_LIMIT_REACHED','SCREENING','INTERVIEWING','FINALISTS','OFFER') AND salary_min IS NOT NULL) AS salary_disclosed,
        (SELECT count(*)::int FROM jobs WHERE status IN ('OPEN','APPLICATIONS_LIMIT_REACHED','SCREENING','INTERVIEWING','FINALISTS','OFFER')) AS active_total,
        (SELECT count(*)::int FROM companies WHERE status = 'VERIFIED') AS verified_companies,
        (SELECT count(*)::int FROM companies) AS companies_total
    `),
    db.execute<{ applications: number; in_review: number; interviews: number; offers: number; hires: number; jobs_interview: number; jobs_offer: number; jobs_hired: number; jobs_published: number }>(sql`
      WITH apps AS (SELECT a.id, a.status, a.job_id FROM applications a WHERE a.created_at > now() - make_interval(days => ${p})),
      reached AS (
        SELECT h.application_id, max(CASE h.to_status WHEN 'INTERVIEW' THEN 1 WHEN 'FINALIST' THEN 1 WHEN 'OFFER' THEN 1 WHEN 'HIRED' THEN 1 ELSE 0 END) AS i,
               max(CASE h.to_status WHEN 'OFFER' THEN 1 WHEN 'HIRED' THEN 1 ELSE 0 END) AS o,
               max(CASE h.to_status WHEN 'HIRED' THEN 1 ELSE 0 END) AS hi
        FROM application_status_history h JOIN apps ON apps.id = h.application_id GROUP BY h.application_id
      )
      SELECT
        (SELECT count(*)::int FROM apps) AS applications,
        (SELECT count(*)::int FROM apps WHERE status IN ('REVIEWING','SHORTLISTED')) AS in_review,
        coalesce(sum(i),0)::int AS interviews, coalesce(sum(o),0)::int AS offers, coalesce(sum(hi),0)::int AS hires,
        (SELECT count(DISTINCT a.job_id)::int FROM apps a JOIN reached r ON r.application_id = a.id WHERE r.i = 1) AS jobs_interview,
        (SELECT count(DISTINCT a.job_id)::int FROM apps a JOIN reached r ON r.application_id = a.id WHERE r.o = 1) AS jobs_offer,
        (SELECT count(*)::int FROM jobs WHERE status = 'HIRED' AND updated_at > now() - make_interval(days => ${p})) AS jobs_hired,
        (SELECT count(*)::int FROM jobs WHERE published_at > now() - make_interval(days => ${p})) AS jobs_published
      FROM reached
    `),
    db.execute<{ due: number; on_time: number; median_days: number | null; responded: number }>(sql`
      WITH apps AS (
        SELECT a.created_at, j.response_sla_days,
          (SELECT min(h.created_at) FROM application_status_history h WHERE h.application_id = a.id AND h.actor_role = 'EMPLOYER') AS first_action
        FROM applications a JOIN jobs j ON j.id = a.job_id
        WHERE a.created_at > now() - make_interval(days => ${p}) AND a.status <> 'WITHDRAWN'
      )
      SELECT
        count(*) FILTER (WHERE first_action IS NOT NULL OR created_at + make_interval(days => response_sla_days) < now())::int AS due,
        count(*) FILTER (WHERE first_action <= created_at + make_interval(days => response_sla_days))::int AS on_time,
        count(*) FILTER (WHERE first_action IS NOT NULL)::int AS responded,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM first_action - created_at) / 86400.0) FILTER (WHERE first_action IS NOT NULL) AS median_days
      FROM apps
    `),
    db.execute<{ status: string; n: number }>(sql`
      SELECT status, count(*)::int AS n FROM jobs WHERE status <> 'DRAFT' GROUP BY status
    `),
    db.execute<{ status: string; n: number }>(sql`
      SELECT status, count(*)::int AS n FROM reports WHERE created_at > now() - make_interval(days => ${p}) GROUP BY status
    `),
    db.execute<{ status: string; n: number }>(sql`
      SELECT status, count(*)::int AS n FROM jobs
      WHERE status IN ('HIRED','REJECTED','CANCELLED','EXPIRED') AND updated_at > now() - make_interval(days => ${p})
      GROUP BY status
    `),
  ])

  const c = core.rows[0]
  const f = funnel.rows[0] ?? { applications: 0, in_review: 0, interviews: 0, offers: 0, hires: 0, jobs_interview: 0, jobs_offer: 0, jobs_hired: 0, jobs_published: 0 }
  const r = response.rows[0]
  const reportMap = Object.fromEntries(reports.rows.map((x) => [x.status, x.n]))
  const reportsTotal = reports.rows.reduce((s, x) => s + x.n, 0)

  return {
    periodDays: p,
    generatedAt: new Date().toISOString(),
    threshold: K,
    activeJobs: metric(c.active, c.active, 1),
    jobsPublished: metric(c.published, c.published, 1),
    verifiedCompanies: metric(c.verified_companies, c.companies_total, 1),
    salaryDisclosure: metric(c.active_total ? c.salary_disclosed / c.active_total : null, c.active_total),
    funnel: {
      sampleSize: f.applications,
      suppressed: f.applications < K,
      jobs: f.jobs_published,
      applications: f.applications < K ? null : f.applications,
      inReview: f.applications < K ? null : f.in_review,
      interviews: f.applications < K ? null : f.interviews,
      offers: f.applications < K ? null : f.offers,
      hires: f.applications < K ? null : f.hires,
    },
    jobsReaching: {
      interview: metric(f.jobs_published ? f.jobs_interview / f.jobs_published : null, f.jobs_published),
      offer: metric(f.jobs_published ? f.jobs_offer / f.jobs_published : null, f.jobs_published),
      hire: metric(f.jobs_published ? f.jobs_hired / f.jobs_published : null, f.jobs_published),
    },
    medianResponseDays: metric(r.median_days != null ? Number(r.median_days) : null, r.responded),
    slaCompliance: metric(r.due ? r.on_time / r.due : null, r.due),
    jobStates: jobStates.rows,
    closures: closures.rows,
    reports: {
      // Report counts are not personal data, so they are shown even when small.
      received: reportsTotal,
      underReview: (reportMap.RECEIVED ?? 0) + (reportMap.UNDER_REVIEW ?? 0),
      verified: reportMap.VERIFIED ?? 0,
      dismissed: reportMap.DISMISSED ?? 0,
    },
  }
}

export async function weeklySeries(weeks = 12) {
  const w = Math.min(Math.max(weeks, 4), 52)
  const res = await db.execute<{ week: string; jobs: number; applications: number; interviews: number; offers: number; hires: number }>(sql`
    WITH weeks AS (
      SELECT generate_series(date_trunc('week', now()) - make_interval(weeks => ${w - 1}), date_trunc('week', now()), interval '1 week') AS week
    )
    SELECT to_char(w.week, 'YYYY-MM-DD') AS week,
      (SELECT count(*)::int FROM domain_events e WHERE e.type = 'JOB_PUBLISHED' AND date_trunc('week', e.created_at) = w.week) AS jobs,
      (SELECT count(*)::int FROM domain_events e WHERE e.type = 'APPLICATION_SUBMITTED' AND date_trunc('week', e.created_at) = w.week) AS applications,
      (SELECT count(*)::int FROM domain_events e WHERE e.type = 'APPLICATION_STATUS_CHANGED' AND e.payload->>'to' = 'INTERVIEW' AND date_trunc('week', e.created_at) = w.week) AS interviews,
      (SELECT count(*)::int FROM domain_events e WHERE e.type = 'APPLICATION_STATUS_CHANGED' AND e.payload->>'to' = 'OFFER' AND date_trunc('week', e.created_at) = w.week) AS offers,
      (SELECT count(*)::int FROM domain_events e WHERE e.type = 'APPLICATION_STATUS_CHANGED' AND e.payload->>'to' = 'HIRED' AND date_trunc('week', e.created_at) = w.week) AS hires
    FROM weeks w ORDER BY w.week
  `)
  return res.rows
}

export async function roleBreakdown() {
  const [roles, tech, statusDist] = await Promise.all([
    db.execute<{ category: string; seniority: string; jobs: number; avg_apps: number }>(sql`
      SELECT category, seniority, count(*)::int AS jobs, round(avg(application_count)::numeric, 1)::float AS avg_apps
      FROM jobs WHERE status <> 'DRAFT' AND published_at > now() - interval '90 days'
      GROUP BY category, seniority
      HAVING count(*) >= 3
      ORDER BY jobs DESC LIMIT 20
    `),
    db.execute<{ tech: string; n: number }>(sql`
      SELECT lower(t) AS tech, count(*)::int AS n
      FROM jobs, unnest(technologies) t
      WHERE status <> 'DRAFT' AND published_at > now() - interval '90 days'
      GROUP BY lower(t) HAVING count(*) >= 2 ORDER BY n DESC LIMIT 15
    `),
    db.execute<{ status: string; n: number }>(sql`
      SELECT status, count(*)::int AS n FROM applications WHERE created_at > now() - interval '90 days' GROUP BY status
    `),
  ])
  const total = statusDist.rows.reduce((s, r) => s + r.n, 0)
  return {
    roles: roles.rows,
    technologies: tech.rows,
    applicationStatus: total >= K ? statusDist.rows : [],
    applicationStatusSample: total,
  }
}

/** Neutral, sourced statements for the information bar. Null when unsupported by data. */
export async function informationBar() {
  const m = await marketOverview(30)
  const out: string[] = []
  if (!m.slaCompliance.suppressed && m.slaCompliance.value != null)
    out.push(`${Math.round(m.slaCompliance.value * 100)}% of applications in the last 30 days received an employer update within the expected response period (n=${m.slaCompliance.sampleSize}).`)
  if (!m.salaryDisclosure.suppressed && m.salaryDisclosure.value != null)
    out.push(`${Math.round(m.salaryDisclosure.value * 100)}% of active jobs publish a salary range (n=${m.salaryDisclosure.sampleSize}).`)
  if (m.reports.received > 0)
    out.push(`${m.reports.received} reports were received in the last 30 days. ${m.reports.verified} were verified and ${m.reports.underReview} remain under review.`)
  if (m.activeJobs.value != null) out.push(`${m.activeJobs.value} verified jobs are currently in an active hiring process.`)
  return { statements: out, generatedAt: m.generatedAt }
}
