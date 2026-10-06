import { NextResponse, type NextRequest } from 'next/server'
import { clientIp } from '@/lib/api/request'
import { log } from '@/lib/log'
import { recordDwell } from '@/lib/security/tollai/adapter'
import { TOLLAI_COOKIE } from '@/lib/security/tollai/instance'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const noStore = { 'cache-control': 'no-store' }
  const token = req.cookies.get(TOLLAI_COOKIE)?.value
  if (!token) return NextResponse.json({ ok: false, code: 'NO_SESSION' }, { status: 401, headers: noStore })
  try {
    const r = await recordDwell(token, clientIp(req.headers))
    if (!r.ok) return NextResponse.json(r, { status: 401, headers: noStore })
    return NextResponse.json(
      { ok: true, dwell_ms: Math.round(r.dwellMs), required_ms: r.requiredMs, settled: r.settled },
      { headers: noStore },
    )
  } catch (err) {
    log('error', 'tollai_dwell_failed', { error: (err as Error).message })
    return NextResponse.json({ ok: false, code: 'TOLLAI_ERROR' }, { status: 503, headers: noStore })
  }
}
