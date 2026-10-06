import 'server-only'
import TollAIModule from 'tollai'

/**
 * Minimal typing of the parts of tollai@1.0.0 we actually call, written from
 * the package source (toll-ai/middleware.js, pow.js, session.js). The bundled
 * middleware.d.ts is out of date (it declares getSession/getStats/requireSession,
 * which do not exist at runtime), so we deliberately do not rely on it.
 */
export type TollSession = {
  ip: string
  createdAt: number
  lastSeen: number
  requests: number
  quota: number
  dwellMs: number
  lastDwellAt: number | null
  meta: Record<string, unknown>
}

type TollResult = { status: number; body: Record<string, unknown> }

export type TollAIInstance = {
  powDifficulty: number
  minDwellMs: number
  issueProofChallenge(): { challenge: string; difficulty: number; algorithm: string; expires_in_ms: number }
  verifyProof(input: { challenge: string; nonce: string }): {
    ok: boolean
    reason?: string
    achieved?: number
    difficulty?: number
    workMs?: number
    verifyMs?: number
  }
  mintSession(ip: string, meta: Record<string, unknown>): string
  handleRequest(req: {
    ip: string
    method: string
    headers: Record<string, string>
    cookies: Record<string, string>
    tollScenario?: string
  }): TollResult
  pow: { pending: Map<string, { issuedAt: number }>; ttlMs: number }
  sessions: {
    sessions: Map<string, TollSession>
    ttlMs: number
    markDwell(session: TollSession): number
    touch(token: string, session: TollSession): void
    get(token: string, ip: string): { ok: boolean; reason?: string; session?: TollSession }
  }
  cleanupInterval?: { unref?: () => void }
  destroy(): void
}

const TollAI = TollAIModule as unknown as new (opts: Record<string, unknown>) => TollAIInstance

const globalForToll = globalThis as unknown as { __tollai?: TollAIInstance }

function create(): TollAIInstance {
  const t = new TollAI({
    // 15 bits ≈ 32k SHA-256 hashes: well under a second for a browser, paid
    // once per 15-minute session. Expensive at the scale of thousands of
    // automated sessions, negligible for one human.
    powDifficulty: 15,
    minDwellMs: 1500,
    // Per-instance burst window. Durable cross-instance limits live in
    // rate-limit.ts; this is a cheap first line only.
    rateLimit: 30,
    rateWindowMs: 60_000,
    sessionQuota: 60,
    sessionTtlMs: 15 * 60 * 1000,
  })
  // Do not keep serverless functions alive for TollAI's cleanup timer.
  t.cleanupInterval?.unref?.()
  return t
}

export const tollai: TollAIInstance = globalForToll.__tollai ?? (globalForToll.__tollai = create())

export const TOLLAI_COOKIE = 'tollai_session'
