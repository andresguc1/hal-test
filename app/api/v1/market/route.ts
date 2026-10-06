import { apiRoute } from '@/lib/api/route'
import { informationBar, marketOverview, roleBreakdown, weeklySeries } from '@/lib/services/analytics'

/** Aggregate-only public analytics. No filters that could isolate individuals. */
export const GET = apiRoute({ name: 'market', auth: 'none', rateLimits: [{ scope: 'ip', limit: 60, windowSec: 60 }] }, async ({ req }) => {
  const period = Number(req.nextUrl.searchParams.get('period') ?? 30)
  const [overview, series, breakdown, bar] = await Promise.all([marketOverview(period), weeklySeries(12), roleBreakdown(), informationBar()])
  return { overview, series, breakdown, informationBar: bar }
})
