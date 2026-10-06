import { db } from '@/lib/db'
import { securityEvents } from '@/lib/db/schema'
import { log } from '@/lib/log'

export type SecurityEventType =
  | 'TOLLAI_CHALLENGE_ISSUED'
  | 'TOLLAI_CHALLENGE_REQUIRED'
  | 'TOLLAI_CHALLENGE_SOLVED'
  | 'TOLLAI_CHALLENGE_FAILED'
  | 'TOLLAI_CHALLENGE_EXPIRED'
  | 'TOLLAI_PROOF_REJECTED'
  | 'TOLLAI_DWELL_REQUIRED'
  | 'TOLLAI_SESSION_EXPIRED'
  | 'TOLLAI_RATE_LIMIT_TRIGGERED'
  | 'TOLLAI_ERROR'
  | 'RATE_LIMIT_TRIGGERED'
  | 'SUSPICIOUS_AUTOMATION_DETECTED'
  | 'AUTHZ_DENIED'
  | 'ACCOUNT_RESTRICTED_ACTION'

/**
 * Security telemetry is stored separately from hiring analytics and never
 * feeds public metrics. Writes are best-effort: a telemetry failure must not
 * fail the user's request.
 */
export async function recordSecurityEvent(e: {
  type: SecurityEventType
  path?: string
  method?: string
  userId?: string | null
  ipHash?: string
  uaHash?: string
  decision?: string
  detail?: Record<string, unknown>
  requestId?: string
}) {
  try {
    await db.insert(securityEvents).values({
      type: e.type,
      path: e.path,
      method: e.method,
      userId: e.userId ?? null,
      ipHash: e.ipHash,
      uaHash: e.uaHash,
      decision: e.decision,
      detail: e.detail ?? {},
      requestId: e.requestId,
    })
  } catch (err) {
    log('warn', 'security_event_write_failed', { type: e.type, error: (err as Error).message })
  }
}
