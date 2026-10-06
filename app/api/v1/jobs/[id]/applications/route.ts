import { apiRoute } from '@/lib/api/route'
import { applySchema } from '@/lib/api/schemas'
import { PLATFORM } from '@/lib/config/platform'
import { applicationsForJob, submitApplication } from '@/lib/services/applications'

/**
 * Most sensitive write on the platform. TollAI is mandatory and fails closed:
 * if the protection layer is down we pause applications rather than let
 * automated traffic exhaust a job's limited slots. The atomic slot claim in
 * submitApplication is still the source of truth for the limit itself.
 */
export const POST = apiRoute<{ id: string }>(
  {
    name: 'applications.submit',
    auth: 'required',
    roles: ['CANDIDATE'],
    tollai: 'required',
    tollaiFailMode: 'closed',
    blockTrustStates: 'suspended',
    rateLimits: [
      { scope: 'user', limit: PLATFORM.candidateLimits.applicationsPerMinute, windowSec: 60 },
      { scope: 'user', limit: PLATFORM.candidateLimits.applicationsPerDay, windowSec: 86400 },
      { scope: 'ip', limit: 40, windowSec: 3600 },
    ],
  },
  async ({ viewer, params, json }) => {
    const input = await json(applySchema)
    return submitApplication(viewer, params.id, input)
  },
)

export const GET = apiRoute<{ id: string }>(
  { name: 'applications.listForJob', auth: 'required', roles: ['EMPLOYER'] },
  async ({ viewer, params }) => applicationsForJob(viewer, params.id),
)
