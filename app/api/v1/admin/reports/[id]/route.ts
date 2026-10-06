import { apiRoute } from '@/lib/api/route'
import { adminReportSchema } from '@/lib/api/schemas'
import { reviewReport } from '@/lib/services/reports'

export const POST = apiRoute<{ id: string }>(
  { name: 'admin.report', auth: 'required', roles: ['ADMIN'] },
  async ({ viewer, params, json }) => reviewReport(viewer, params.id, await json(adminReportSchema)),
)
