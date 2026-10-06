import 'server-only'
import { and, eq, gt, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tollaiChallenges, tollaiSessions } from '@/lib/db/schema'
import { hashToken, hashUa } from '@/lib/security/hash'
import { tollai, type TollSession } from './instance'

/**
 * Durability shim around the real TollAI instance.
 *
 * tollai@1.0.0 keeps PoW challenges and sessions in process memory, which does
 * not survive serverless cold starts or span instances. We keep TollAI's own
 * verification logic (verifyProof, SessionStore.get/registerRequest,
 * handleRequest) and only hydrate its Maps from Postgres before each call and
 * write them back afterwards. Challenge single-use is enforced atomically in
 * SQL so a proof cannot be replayed on another instance.
 */

export type TollOutcome =
  | 'PASS'
  | 'CHALLENGE_REQUIRED'
  | 'DWELL_REQUIRED'
  | 'SESSION_EXPIRED'
  | 'BURST_RATE'
  | 'TOLLAI_ERROR'

export type GuardResult = {
  outcome: TollOutcome
  /** Machine-readable code the browser client understands. */
  code?: string
  status?: number
  retryAfterMs?: number
  detail?: Record<string, unknown>
}

/* ---------- challenges ---------- */

export async function issueChallenge() {
  const ch = tollai.issueProofChallenge()
  // Not kept in memory: Postgres is the source of truth for pending challenges.
  tollai.pow.pending.delete(ch.challenge)
  await db.insert(tollaiChallenges).values({ challenge: ch.challenge })
  return ch
}

export type VerifyResult =
  | { ok: true; token: string; workMs: number; difficulty: number }
  | { ok: false; code: string; achieved?: number; required?: number }

export async function verifyChallenge(input: { challenge: string; nonce: string; ip: string; userAgent: string }): Promise<VerifyResult> {
  if (typeof input.challenge !== 'string' || typeof input.nonce !== 'string' || !/^\d{1,12}$/.test(input.nonce))
    return { ok: false, code: 'MALFORMED' }

  const ttlSec = Math.floor(tollai.pow.ttlMs / 1000)
  // Atomic single-use: only the first verifier can consume a challenge.
  const consumed = await db
    .update(tollaiChallenges)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(tollaiChallenges.challenge, input.challenge),
        isNull(tollaiChallenges.consumedAt),
        gt(tollaiChallenges.issuedAt, sql`now() - make_interval(secs => ${ttlSec})`),
      ),
    )
    .returning({ issuedAt: tollaiChallenges.issuedAt })

  if (consumed.length === 0) {
    const [row] = await db
      .select({ consumedAt: tollaiChallenges.consumedAt })
      .from(tollaiChallenges)
      .where(eq(tollaiChallenges.challenge, input.challenge))
      .limit(1)
    if (!row) return { ok: false, code: 'UNKNOWN_CHALLENGE' }
    return { ok: false, code: row.consumedAt ? 'CHALLENGE_REPLAYED' : 'CHALLENGE_EXPIRED' }
  }

  // Hand the challenge to TollAI's own verifier (it re-checks TTL and difficulty).
  tollai.pow.pending.set(input.challenge, { issuedAt: consumed[0].issuedAt.getTime() })
  const result = tollai.verifyProof({ challenge: input.challenge, nonce: input.nonce })
  tollai.pow.pending.delete(input.challenge)

  if (!result.ok) {
    return { ok: false, code: result.reason ?? 'INVALID_PROOF', achieved: result.achieved, required: result.difficulty }
  }

  const token = tollai.mintSession(input.ip, {
    workMs: result.workMs,
    difficulty: result.difficulty,
    uaHash: hashUa(input.userAgent),
  })
  await persistSession(token)
  return { ok: true, token, workMs: result.workMs ?? 0, difficulty: result.difficulty ?? tollai.powDifficulty }
}

/* ---------- sessions ---------- */

async function hydrateSession(token: string): Promise<boolean> {
  const [row] = await db
    .select({ data: tollaiSessions.data })
    .from(tollaiSessions)
    .where(and(eq(tollaiSessions.tokenHash, hashToken(token)), isNull(tollaiSessions.revokedAt)))
    .limit(1)
  if (!row) {
    tollai.sessions.sessions.delete(token)
    return false
  }
  tollai.sessions.sessions.set(token, row.data as unknown as TollSession)
  return true
}

async function persistSession(token: string) {
  const s = tollai.sessions.sessions.get(token)
  const tokenHash = hashToken(token)
  if (s) {
    await db
      .insert(tollaiSessions)
      .values({ tokenHash, data: s as unknown as Record<string, unknown>, lastSeen: new Date(s.lastSeen) })
      .onConflictDoUpdate({
        target: tollaiSessions.tokenHash,
        set: { data: s as unknown as Record<string, unknown>, lastSeen: new Date(s.lastSeen) },
      })
  } else {
    // TollAI revoked it (expired, IP mismatch, or quota exhausted).
    await db.update(tollaiSessions).set({ revokedAt: new Date() }).where(eq(tollaiSessions.tokenHash, tokenHash))
  }
  tollai.sessions.sessions.delete(token)
}

/**
 * Lets server-rendered pages preset `window.TOLLAI_SESSION` so a returning
 * browser doesn't re-pay the PoW on every page load. This is only a hint:
 * if the session has since expired, the client wrapper sees 401/428 on the
 * next protected call and re-proves once.
 */
export async function hasLiveSession(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    const [row] = await db
      .select({ lastSeen: tollaiSessions.lastSeen })
      .from(tollaiSessions)
      .where(and(eq(tollaiSessions.tokenHash, hashToken(token)), isNull(tollaiSessions.revokedAt)))
      .limit(1)
    return Boolean(row && Date.now() - row.lastSeen.getTime() < tollai.sessions.ttlMs)
  } catch {
    return false
  }
}

export async function recordDwell(token: string, ip: string) {
  if (!(await hydrateSession(token))) return { ok: false as const, code: 'NO_SESSION' }
  const res = tollai.sessions.get(token, ip)
  if (!res.ok || !res.session) {
    await persistSession(token)
    return { ok: false as const, code: res.reason ?? 'SESSION_INVALID' }
  }
  const dwellMs = tollai.sessions.markDwell(res.session)
  tollai.sessions.touch(token, res.session)
  await persistSession(token)
  return { ok: true as const, dwellMs, requiredMs: tollai.minDwellMs, settled: dwellMs >= tollai.minDwellMs }
}

/**
 * Run TollAI's real request pipeline (session → dwell → burst → browser
 * checks) for a protected mutation and map its result onto our outcome model.
 */
export async function guardRequest(input: {
  token: string | undefined
  ip: string
  method: string
  headers: Headers
  scenario: string
}): Promise<GuardResult> {
  const hadToken = Boolean(input.token)
  const hydrated = input.token ? await hydrateSession(input.token) : false

  const headers: Record<string, string> = {}
  input.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v
  })

  const result = tollai.handleRequest({
    ip: input.ip,
    method: input.method,
    headers,
    cookies: input.token ? { tollai_session: input.token } : {},
    tollScenario: input.scenario,
  })
  if (input.token) await persistSession(input.token)

  const code = typeof result.body.code === 'string' ? result.body.code : undefined

  if (result.status === 200 && result.body.transparent === true) return { outcome: 'PASS' }

  if (result.status === 428 && code === 'DWELL_REQUIRED') {
    const retry = Number(result.body.retry_after_ms) || 300
    return { outcome: 'DWELL_REQUIRED', code, status: 428, retryAfterMs: retry }
  }
  if (result.status === 428) {
    return { outcome: 'SESSION_EXPIRED', code: code ?? 'REPROOF_REQUIRED', status: 428 }
  }
  if (result.status === 403 && code === 'BURST_RATE') {
    return { outcome: 'BURST_RATE', code, status: 429, detail: { requests: result.body.requests } }
  }

  // Everything else (401 challenge, 433 for bot UAs, or an HTML shell for
  // first-visit browsers) means "no valid TollAI session for this mutation".
  return {
    outcome: hadToken && !hydrated ? 'SESSION_EXPIRED' : 'CHALLENGE_REQUIRED',
    code: 'ATTESTATION_REQUIRED',
    status: 401,
    detail: { tollaiStatus: result.status, tollaiCode: code ?? null },
  }
}
