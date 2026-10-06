import 'server-only'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Idempotent sweeps run by cron (and safe to run repeatedly):
 *   - applications past their SLA → APPLICATION_RESPONSE_OVERDUE
 *   - intake-phase jobs past expiry → EXPIRED
 *   - housekeeping for TollAI challenges and rate-limit buckets
 * Paused jobs do not accrue overdue applications: the employer announced it.
 */
export async function runSweeps() {
  return db.transaction(async (tx) => {
    const overdue = await tx.execute<{ id: string; candidate_id: string; job_id: string; company_id: string; from_status: string; title: string }>(sql`
      WITH due AS (
        SELECT a.id, a.status AS from_status FROM applications a JOIN jobs j ON j.id = a.job_id
        WHERE a.status IN ('APPLIED','REVIEWING','SHORTLISTED','INTERVIEW','FINALIST','OFFER')
          AND a.sla_deadline < now()
          AND j.status NOT IN ('PAUSED','CANCELLED')
        FOR UPDATE OF a SKIP LOCKED
      )
      UPDATE applications a SET status = 'APPLICATION_RESPONSE_OVERDUE', updated_at = now(), version = a.version + 1
      FROM due, jobs j
      WHERE a.id = due.id AND j.id = a.job_id
      RETURNING a.id, a.candidate_id, a.job_id, j.company_id, due.from_status, j.title
    `)

    for (const r of overdue.rows) {
      await tx.execute(sql`
        INSERT INTO application_status_history (application_id, from_status, to_status, actor_role)
        VALUES (${r.id}, ${r.from_status}, 'APPLICATION_RESPONSE_OVERDUE', 'SYSTEM')
      `)
      await tx.execute(sql`
        INSERT INTO domain_events (type, idempotency_key, job_id, company_id, application_id, payload)
        VALUES ('APPLICATION_OVERDUE', ${`overdue:${r.id}:${r.from_status}`}, ${r.job_id}, ${r.company_id}, ${r.id}, '{}'::jsonb)
        ON CONFLICT (idempotency_key) DO NOTHING
      `)
      await tx.execute(sql`
        INSERT INTO notifications (user_id, kind, title, body, link)
        VALUES (${r.candidate_id}, 'APPLICATION_OVERDUE', ${`No employer response yet for "${r.title}"`},
          'The expected response period has passed. You can report non-response from your applications page.', '/me/applications')
      `)
    }

    const expired = await tx.execute<{ id: string; company_id: string }>(sql`
      UPDATE jobs SET status = 'EXPIRED', updated_at = now(), version = version + 1
      WHERE status IN ('DRAFT','OPEN','APPLICATIONS_LIMIT_REACHED','PAUSED') AND expires_at IS NOT NULL AND expires_at < now()
      RETURNING id, company_id
    `)
    for (const j of expired.rows) {
      await tx.execute(sql`
        INSERT INTO domain_events (type, idempotency_key, job_id, company_id) VALUES ('JOB_EXPIRED', ${`expired:${j.id}`}, ${j.id}, ${j.company_id})
        ON CONFLICT (idempotency_key) DO NOTHING
      `)
    }

    await tx.execute(sql`DELETE FROM tollai_challenges WHERE issued_at < now() - interval '1 hour'`)
    await tx.execute(sql`DELETE FROM tollai_sessions WHERE last_seen < now() - interval '1 day'`)
    await tx.execute(sql`DELETE FROM rate_limit_buckets WHERE window_start < now() - interval '2 days'`)

    return { overdue: overdue.rows.length, expired: expired.rows.length }
  })
}
