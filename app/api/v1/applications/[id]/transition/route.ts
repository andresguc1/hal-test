import { apiRoute } from '@/lib/api/route'
import { transitionSchema } from '@/lib/api/schemas'
import { employerTransition } from '@/lib/services/applications'

export const POST = apiRoute<{ id: string }>(
  { name: 'applications.transition', auth: 'required', roles: ['EMPLOYER'], rateLimits: [{ scope: 'user', limit: 300, windowSec: 3600 }] },
  async ({ viewer, params, json }) => employerTransition(viewer, params.id, await json(transitionSchema)),
)
