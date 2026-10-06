import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { log } from '@/lib/log'
import { runSweeps } from '@/lib/services/sweeps'

export const dynamic = 'force-dynamic'

/** Service-to-service: authenticated by CRON_SECRET, never by TollAI. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const given = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  if (!secret || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected)))
    return NextResponse.json({ code: 'UNAUTHENTICATED' }, { status: 401 })
  try {
    const result = await runSweeps()
    log('info', 'sweep_complete', result)
    return NextResponse.json(result)
  } catch (err) {
    log('error', 'sweep_failed', { error: (err as Error).message })
    return NextResponse.json({ code: 'SWEEP_FAILED' }, { status: 500 })
  }
}
