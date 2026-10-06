import { apiRoute } from '@/lib/api/route'
import { jobStatusSchema } from '@/lib/api/schemas'
import { transitionJob } from '@/lib/services/jobs'

export const POST = apiRoute<{ id: string }>(
  { name: 'jobs.status', auth: 'required', roles: ['EMPLOYER'], rateLimits: [{ scope: 'user', limit: 60, windowSec: 3600 }] },
  async ({ viewer, params, json }) => {
    const { to, reason } = await json(jobStatusSchema)
    return transitionJob(viewer, params.id, to, reason)
  },
)
