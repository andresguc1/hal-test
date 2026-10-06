import { apiRoute } from '@/lib/api/route'
import { checkDomainVerification } from '@/lib/services/companies'

export const POST = apiRoute<{ id: string }>(
  { name: 'companies.verify', auth: 'required', roles: ['EMPLOYER'], rateLimits: [{ scope: 'user', limit: 20, windowSec: 3600 }] },
  async ({ viewer, params }) => checkDomainVerification(viewer, params.id),
)
