import { NextResponse, type NextRequest } from 'next/server'
import { clientIp } from '@/lib/api/request'
import { log } from '@/lib/log'
import { hashIp } from '@/lib/security/hash'
import { consumeRateLimit } from '@/lib/security/rate-limit'
import { issueChallenge } from '@/lib/security/tollai/adapter'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Challenges are cheap to issue but each row is stored; cap per IP.
    const rl = await consumeRateLimit({ key: `tollai-challenge:${hashIp(clientIp(req.headers))}`, limit: 30, windowSec: 60 })
    if (!rl.ok) return NextResponse.json({ code: 'RATE_LIMITED' }, { status: 429, headers: { 'cache-control': 'no-store' } })
    const ch = await issueChallenge()
    return NextResponse.json(ch, { headers: { 'cache-control': 'no-store' } })
  } catch (err) {
    log('error', 'tollai_challenge_failed', { error: (err as Error).message })
    return NextResponse.json({ code: 'TOLLAI_ERROR' }, { status: 503, headers: { 'cache-control': 'no-store' } })
  }
}
