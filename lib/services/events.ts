import 'server-only'
import type { Tx } from '@/lib/db'
import { auditLogs, domainEvents, notifications } from '@/lib/db/schema'

export type DomainEventType =
  | 'COMPANY_CREATED'
  | 'COMPANY_VERIFIED'
  | 'JOB_PUBLISHED'
  | 'JOB_STATUS_CHANGED'
  | 'JOB_FILLED'
  | 'JOB_EXPIRED'
  | 'JOB_CANCELLED'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_STATUS_CHANGED'
  | 'APPLICATION_WITHDRAWN'
  | 'APPLICATION_OVERDUE'
  | 'EMPLOYER_RESPONSE_SENT'
  | 'REPORT_RECEIVED'
  | 'REPORT_VERIFIED'
  | 'REPORT_DISMISSED'
  | 'COMMUNITY_JOB_SUBMITTED'

/**
 * Hiring analytics are derived only from these server-written events.
 * The idempotency key makes replays and double-submits no-ops.
 */
export async function emitEvent(
  tx: Tx,
  e: {
    type: DomainEventType
    idempotencyKey: string
    jobId?: string | null
    companyId?: string | null
    applicationId?: string | null
    payload?: Record<string, unknown>
  },
) {
  await tx
    .insert(domainEvents)
    .values({
      type: e.type,
      idempotencyKey: e.idempotencyKey,
      jobId: e.jobId ?? null,
      companyId: e.companyId ?? null,
      applicationId: e.applicationId ?? null,
      payload: e.payload ?? {},
    })
    .onConflictDoNothing({ target: domainEvents.idempotencyKey })
}

export async function audit(
  tx: Tx,
  a: {
    actorId: string
    action: string
    targetType: string
    targetId: string
    reason: string
    previousState?: unknown
    newState?: unknown
  },
) {
  await tx.insert(auditLogs).values({
    actorId: a.actorId,
    action: a.action,
    targetType: a.targetType,
    targetId: a.targetId,
    reason: a.reason,
    previousState: a.previousState ?? null,
    newState: a.newState ?? null,
  })
}

export async function notify(
  tx: Tx,
  n: { userId: string; kind: string; title: string; body: string; link?: string },
) {
  await tx.insert(notifications).values(n)
}
