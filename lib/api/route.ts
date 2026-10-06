import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import type { ZodType } from 'zod'
import { ApiError, Errors, errorBody } from '@/lib/api/errors'
import { clientIp, requestId as getRequestId } from '@/lib/api/request'
import { log } from '@/lib/log'
import { recordSecurityEvent } from '@/lib/security/events'
import { hashIp, hashUa } from '@/lib/security/hash'
import { consumeRateLimit } from '@/lib/security/rate-limit'
import { guardRequest, type GuardResult } from '@/lib/security/tollai/adapter'
import { TOLLAI_COOKIE } from '@/lib/security/tollai/instance'
import { getViewerFromHeaders, type Role, type Viewer } from '@/lib/viewer'

type RateRule = { scope: 'user' | 'ip'; limit: number; windowSec: number }

export type Policy = {
  name: string
  auth: 'required' | 'optional' | 'none'
  roles?: Role[]
  /**
   * required: every call must carry a valid TollAI session.
   * risk:     only new / non-NORMAL / high-velocity accounts are tolled.
   * off:      never (public reads, health, cron).
   */
  tollai?: 'required' | 'risk' | 'off'
  /** What to do if TollAI itself throws. Defaults: closed for required, open for risk. */
  tollaiFailMode?: 'closed' | 'open'
  rateLimits?: RateRule[]
  /** Block SUSPENDED users (and LIMITED users when 'limited'). */
  blockTrustStates?: 'suspended' | 'limited'
}

export type Ctx<P> = {
  req: NextRequest
  params: P
  viewer: Viewer | null
  requestId: string
  ip: string
  ipHash: string
  json<T>(schema: ZodType<T>): Promise<T>
}

type RouteCtx<P> = { params: Promise<P> }

const RISK_ACCOUNT_AGE_MS = 72 * 60 * 60 * 1000

export function apiRoute<P = Record<string, never>, R = unknown>(
  policy: Policy,
  handler: (ctx: Ctx<P> & { viewer: Viewer }) => Promise<R>,
): (req: NextRequest, rc: RouteCtx<P>) => Promise<NextResponse>
export function apiRoute<P = Record<string, never>, R = unknown>(
  policy: Policy,
  handler: (ctx: Ctx<P>) => Promise<R>,
): (req: NextRequest, rc: RouteCtx<P>) => Promise<NextResponse>
export function apiRoute<P, R>(policy: Policy, handler: (ctx: Ctx<P> & { viewer: Viewer }) => Promise<R>) {
  return async (req: NextRequest, rc: RouteCtx<P>) => {
    const rid = getRequestId(req.headers)
    const ip = clientIp(req.headers)
    const ipHash = hashIp(ip)
    const started = Date.now()
    let viewer: Viewer | null = null

    try {
      // 1. Authentication
      if (policy.auth !== 'none') viewer = await getViewerFromHeaders(req.headers)
      if (policy.auth === 'required' && !viewer) throw Errors.unauthenticated()

      // 2. Authorization (role) and account standing
      if (viewer && policy.roles && !policy.roles.includes(viewer.role)) {
        await recordSecurityEvent({ type: 'AUTHZ_DENIED', path: req.nextUrl.pathname, method: req.method, userId: viewer.userId, ipHash, requestId: rid, detail: { policy: policy.name, role: viewer.role } })
        throw Errors.forbidden()
      }
      if (viewer && policy.blockTrustStates) {
        const blocked =
          viewer.trustState === 'SUSPENDED' ||
          (policy.blockTrustStates === 'limited' && (viewer.trustState === 'LIMITED' || viewer.trustState === 'REVIEW_REQUIRED'))
        if (blocked) {
          await recordSecurityEvent({ type: 'ACCOUNT_RESTRICTED_ACTION', path: req.nextUrl.pathname, method: req.method, userId: viewer.userId, ipHash, requestId: rid, detail: { trustState: viewer.trustState } })
          throw new ApiError(403, 'ACCOUNT_RESTRICTED', 'Your account is currently restricted from this action. You can appeal from your account page.')
        }
      }

      // 3. Risk evaluation → TollAI
      const mode = policy.tollai ?? 'off'
      const risky =
        mode === 'required' ||
        (mode === 'risk' &&
          (!viewer ||
            viewer.trustState !== 'NORMAL' ||
            Date.now() - viewer.accountCreatedAt.getTime() < RISK_ACCOUNT_AGE_MS))
      if (mode !== 'off' && risky) {
        const failMode = policy.tollaiFailMode ?? (mode === 'required' ? 'closed' : 'open')
        let guard: GuardResult
        try {
          guard = await guardRequest({
            token: req.cookies.get(TOLLAI_COOKIE)?.value,
            ip,
            method: req.method,
            headers: req.headers,
            scenario: policy.name,
          })
        } catch (err) {
          guard = { outcome: 'TOLLAI_ERROR', detail: { error: (err as Error).message } }
        }

        if (guard.outcome !== 'PASS') {
          const typeMap = {
            CHALLENGE_REQUIRED: 'TOLLAI_CHALLENGE_REQUIRED',
            DWELL_REQUIRED: 'TOLLAI_DWELL_REQUIRED',
            SESSION_EXPIRED: 'TOLLAI_SESSION_EXPIRED',
            BURST_RATE: 'TOLLAI_RATE_LIMIT_TRIGGERED',
            TOLLAI_ERROR: 'TOLLAI_ERROR',
          } as const
          const failOpen = guard.outcome === 'TOLLAI_ERROR' && failMode === 'open'
          await recordSecurityEvent({
            type: typeMap[guard.outcome],
            path: req.nextUrl.pathname,
            method: req.method,
            userId: viewer?.userId,
            ipHash,
            uaHash: hashUa(req.headers.get('user-agent') ?? ''),
            decision: failOpen ? 'FAIL_OPEN' : 'BLOCK',
            detail: { policy: policy.name, ...guard.detail },
            requestId: rid,
          })
          if (guard.outcome === 'TOLLAI_ERROR') {
            log('error', 'tollai_error', { requestId: rid, policy: policy.name, ...guard.detail })
            if (!failOpen)
              throw new ApiError(503, 'PROTECTION_UNAVAILABLE', 'This action is temporarily unavailable. Please try again shortly.')
          } else if (guard.outcome === 'DWELL_REQUIRED') {
            throw new ApiError(428, 'DWELL_REQUIRED', 'Please wait a moment and try again.', { retry_after_ms: guard.retryAfterMs })
          } else if (guard.outcome === 'BURST_RATE') {
            throw new ApiError(429, 'BURST_RATE', 'Too many requests. Please slow down.')
          } else {
            throw new ApiError(guard.status ?? 401, guard.code ?? 'ATTESTATION_REQUIRED', 'Your browser session needs to be refreshed. Please retry.')
          }
        }
      }

      // 4. Durable rate limits (cross-instance)
      for (const rule of policy.rateLimits ?? []) {
        const subject = rule.scope === 'user' ? viewer?.userId : ipHash
        if (!subject) continue
        const limit = viewer?.trustState === 'LIMITED' ? Math.max(1, Math.floor(rule.limit / 3)) : rule.limit
        const r = await consumeRateLimit({ key: `${policy.name}:${rule.scope}:${subject}:${rule.windowSec}`, limit, windowSec: rule.windowSec })
        if (!r.ok) {
          await recordSecurityEvent({ type: 'RATE_LIMIT_TRIGGERED', path: req.nextUrl.pathname, method: req.method, userId: viewer?.userId, ipHash, requestId: rid, detail: { policy: policy.name, scope: rule.scope, count: r.count, limit } })
          throw Errors.rateLimited(r.retryAfterSec)
        }
      }

      // 5. Validation + business rules (inside handler)
      const params = (await rc.params) as P
      const ctx: Ctx<P> = {
        req,
        params,
        viewer,
        requestId: rid,
        ip,
        ipHash,
        async json<T>(schema: ZodType<T>) {
          let body: unknown
          try {
            body = await req.json()
          } catch {
            throw Errors.invalid('Request body must be valid JSON.')
          }
          const parsed = schema.safeParse(body)
          if (!parsed.success) {
            const fields: Record<string, string[]> = {}
            for (const issue of parsed.error.issues) {
              const k = issue.path.join('.') || '_'
              ;(fields[k] ??= []).push(issue.message)
            }
            throw Errors.invalid('Some fields are invalid.', fields)
          }
          return parsed.data
        },
      }
      // Safe: auth:'required' routes have thrown above if viewer is null.
      const data = await handler(ctx as Ctx<P> & { viewer: Viewer })
      log('info', 'api_ok', { requestId: rid, policy: policy.name, ms: Date.now() - started, userId: viewer?.userId })
      return NextResponse.json(data ?? { ok: true }, { headers: { 'x-request-id': rid, 'cache-control': 'no-store' } })
    } catch (err) {
      const apiErr =
        err instanceof ApiError
          ? err
          : new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.')
      if (!(err instanceof ApiError))
        log('error', 'api_unhandled', { requestId: rid, policy: policy.name, error: (err as Error)?.message })
      const headers: Record<string, string> = { 'x-request-id': rid, 'cache-control': 'no-store' }
      if (apiErr.status === 429 && apiErr.extra.retry_after_s) headers['retry-after'] = String(apiErr.extra.retry_after_s)
      return NextResponse.json(errorBody(apiErr, rid), { status: apiErr.status, headers })
    }
  }
}
