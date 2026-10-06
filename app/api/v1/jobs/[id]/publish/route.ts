import { apiRoute } from '@/lib/api/route'
import { publishJob } from '@/lib/services/jobs'

export const POST = apiRoute<{ id: string }>(
  { name: 'jobs.publish', auth: 'required', roles: ['EMPLOYER'], tollai: 'risk', blockTrustStates: 'limited', rateLimits: [{ scope: 'user', limit: 20, windowSec: 86400 }] },
  async ({ viewer, params }) => publishJob(viewer, params.id),
)
