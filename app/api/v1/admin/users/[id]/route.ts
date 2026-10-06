import { apiRoute } from '@/lib/api/route'
import { adminUserSchema } from '@/lib/api/schemas'
import { setCandidateTrust } from '@/lib/services/reports'

export const POST = apiRoute<{ id: string }>(
  { name: 'admin.user', auth: 'required', roles: ['ADMIN'] },
  async ({ viewer, params, json }) => setCandidateTrust(viewer, params.id, await json(adminUserSchema)),
)
