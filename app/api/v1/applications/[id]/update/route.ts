import { apiRoute } from '@/lib/api/route'
import { statusUpdateSchema } from '@/lib/api/schemas'
import { employerStatusUpdate } from '@/lib/services/applications'

export const POST = apiRoute<{ id: string }>(
  { name: 'applications.update', auth: 'required', roles: ['EMPLOYER'], rateLimits: [{ scope: 'user', limit: 300, windowSec: 3600 }] },
  async ({ viewer, params, json }) => employerStatusUpdate(viewer, params.id, await json(statusUpdateSchema)),
)
