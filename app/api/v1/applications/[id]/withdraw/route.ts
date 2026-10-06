import { apiRoute } from '@/lib/api/route'
import { withdrawApplication } from '@/lib/services/applications'

export const POST = apiRoute<{ id: string }>(
  { name: 'applications.withdraw', auth: 'required', roles: ['CANDIDATE'], rateLimits: [{ scope: 'user', limit: 30, windowSec: 3600 }] },
  async ({ viewer, params }) => withdrawApplication(viewer, params.id),
)
