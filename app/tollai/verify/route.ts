import { NextResponse, type NextRequest } from 'next/server'
import { clientIp } from '@/lib/api/request'
import { log } from '@/lib/log'
import { recordSecurityEvent } from '@/lib/security/events'
import { hashIp, hashUa } from '@/lib/security/hash'
import { verifyChallenge } from '@/lib/security/tollai/adapter'
import { TOLLAI_COOKIE } from '@/lib/security/tollai/instance'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  const ua = req.headers.get('user-agent') ?? ''
  const noStore = { 'cache-control': 'no-store' }
  try {
    const body = (await req.json().catch(() => ({}))) as { challenge?: unknown; nonce?: unknown }
    const result = await verifyChallenge({
      challenge: String(body.challenge ?? ''),
      nonce: String(body.nonce ?? ''),
      ip,
      userAgent: ua,
    })

    if (!result.ok) {
      const type =
        result.code === 'CHALLENGE_EXPIRED' || result.code === 'EXPIRED'
          ? 'TOLLAI_CHALLENGE_EXPIRED'
          : result.code === 'CHALLENGE_REPLAYED'
            ? 'TOLLAI_PROOF_REJECTED'
            : 'TOLLAI_CHALLENGE_FAILED'
      await recordSecurityEvent({ type, path: '/tollai/verify', method: 'POST', ipHash: hashIp(ip), uaHash: hashUa(ua), decision: 'REJECT', detail: { code: result.code, achieved: result.achieved, required: result.required } })
      return NextResponse.json({ verified: false, code: result.code }, { status: 403, headers: noStore })
    }

    await recordSecurityEvent({ type: 'TOLLAI_CHALLENGE_SOLVED', path: '/tollai/verify', method: 'POST', ipHash: hashIp(ip), uaHash: hashUa(ua), decision: 'SESSION_MINTED', detail: { workMs: result.workMs, difficulty: result.difficulty } })

    const res = NextResponse.json({ verified: true, work_ms: result.workMs, difficulty: result.difficulty }, { headers: noStore })
    res.cookies.set(TOLLAI_COOKIE, result.token, {
      httpOnly: true,
      // Matches Better Auth's dev override so the cookie survives the v0 preview iframe.
      sameSite: process.env.NODE_ENV === 'development' ? 'none' : 'lax',
      secure: process.env.NODE_ENV !== 'test',
      path: '/',
      maxAge: 15 * 60,
    })
    return res
  } catch (err) {
    log('error', 'tollai_verify_failed', { error: (err as Error).message })
    return NextResponse.json({ verified: false, code: 'TOLLAI_ERROR' }, { status: 503, headers: noStore })
  }
}
