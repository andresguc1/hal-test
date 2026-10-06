import { apiRoute } from '@/lib/api/route'
import { searchJobs } from '@/lib/services/jobs'

/** Public read: no TollAI, generous per-IP limit to slow bulk enumeration. */
export const GET = apiRoute({ name: 'jobs.search', auth: 'none', tollai: 'off', rateLimits: [{ scope: 'ip', limit: 120, windowSec: 60 }] }, async ({ req }) => {
  const s = req.nextUrl.searchParams
  return searchJobs({
    q: s.get('q') ?? undefined,
    category: s.get('category') ?? undefined,
    seniority: s.get('seniority') ?? undefined,
    workMode: s.get('workMode') ?? undefined,
    salaryOnly: s.get('salary') === '1',
    openOnly: s.get('open') === '1',
    cursor: s.get('cursor') ?? undefined,
    limit: Number(s.get('limit') ?? 20),
  })
})
