import { apiRoute } from '@/lib/api/route'
import { jobSchema } from '@/lib/api/schemas'
import { createJobDraft } from '@/lib/services/jobs'

export const POST = apiRoute<{ id: string }>(
  { name: 'jobs.create', auth: 'required', roles: ['EMPLOYER'], tollai: 'risk', blockTrustStates: 'limited', rateLimits: [{ scope: 'user', limit: 20, windowSec: 86400 }] },
  async ({ viewer, params, json }) => {
    const input = await json(jobSchema)
    return createJobDraft(viewer, params.id, input)
  },
)
