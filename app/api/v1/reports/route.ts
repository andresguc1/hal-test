import { apiRoute } from '@/lib/api/route'
import { reportSchema } from '@/lib/api/schemas'
import { PLATFORM } from '@/lib/config/platform'
import { createReport } from '@/lib/services/reports'

/**
 * TollAI here detects scripted report floods. It says nothing about whether
 * a report is true; that is decided by Trust & Safety review.
 */
export const POST = apiRoute(
  {
    name: 'reports.create',
    auth: 'required',
    tollai: 'required',
    tollaiFailMode: 'closed',
    blockTrustStates: 'suspended',
    rateLimits: [
      { scope: 'user', limit: PLATFORM.candidateLimits.reportsPerDay, windowSec: 86400 },
      { scope: 'ip', limit: 20, windowSec: 86400 },
    ],
  },
  async ({ viewer, json }) => createReport(viewer, await json(reportSchema)),
)
