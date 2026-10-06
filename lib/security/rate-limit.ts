import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export type RateLimitRule = { key: string; limit: number; windowSec: number }

/**
 * Fixed-window counter in Postgres. Atomic via INSERT ... ON CONFLICT, so it
 * is correct across serverless instances (unlike TollAI's in-memory burst
 * window, which is per-instance).
 */
export async function consumeRateLimit(rule: RateLimitRule): Promise<{ ok: boolean; count: number; retryAfterSec: number }> {
  const nowSec = Math.floor(Date.now() / 1000)
  const windowStartSec = nowSec - (nowSec % rule.windowSec)
  const res = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limit_buckets (key, window_start, count)
    VALUES (${rule.key}, to_timestamp(${windowStartSec}), 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limit_buckets.count + 1
    RETURNING count
  `)
  const count = Number(res.rows[0]?.count ?? 1)
  return {
    ok: count <= rule.limit,
    count,
    retryAfterSec: windowStartSec + rule.windowSec - nowSec,
  }
}

/** Read-only peek used by risk scoring (does not consume). */
export async function peekRateLimit(key: string, windowSec: number): Promise<number> {
  const nowSec = Math.floor(Date.now() / 1000)
  const windowStartSec = nowSec - (nowSec % windowSec)
  const res = await db.execute<{ count: number }>(sql`
    SELECT count FROM rate_limit_buckets WHERE key = ${key} AND window_start = to_timestamp(${windowStartSec})
  `)
  return Number(res.rows[0]?.count ?? 0)
}
