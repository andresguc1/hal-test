import { apiRoute } from '@/lib/api/route'
import { adminCompanySchema } from '@/lib/api/schemas'
import { setCompanyStatus } from '@/lib/services/reports'

export const POST = apiRoute<{ id: string }>(
  { name: 'admin.company', auth: 'required', roles: ['ADMIN'] },
  async ({ viewer, params, json }) => setCompanyStatus(viewer, params.id, await json(adminCompanySchema)),
)
