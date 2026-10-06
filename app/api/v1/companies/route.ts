import { apiRoute } from '@/lib/api/route'
import { companySchema } from '@/lib/api/schemas'
import { createCompany } from '@/lib/services/companies'

export const POST = apiRoute(
  { name: 'companies.create', auth: 'required', roles: ['EMPLOYER'], tollai: 'risk', blockTrustStates: 'limited', rateLimits: [{ scope: 'user', limit: 3, windowSec: 86400 }, { scope: 'ip', limit: 10, windowSec: 86400 }] },
  async ({ viewer, json }) => {
    const input = await json(companySchema)
    const c = await createCompany(viewer, input)
    return { id: c.id, slug: c.slug, status: c.status, verificationToken: c.verificationToken, domain: c.domain }
  },
)
