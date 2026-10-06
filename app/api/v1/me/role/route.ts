import { eq } from 'drizzle-orm'
import { ApiError } from '@/lib/api/errors'
import { apiRoute } from '@/lib/api/route'
import { roleSchema } from '@/lib/api/schemas'
import { db } from '@/lib/db'
import { applications, companyMembers, userProfile } from '@/lib/db/schema'

/** One-time role choice. ADMIN can never be self-assigned. */
export const POST = apiRoute({ name: 'me.role', auth: 'required', rateLimits: [{ scope: 'user', limit: 10, windowSec: 3600 }] }, async ({ viewer, json }) => {
  const { role } = await json(roleSchema)
  if (viewer.role === 'ADMIN') throw new ApiError(409, 'ROLE_LOCKED', 'Admin role cannot be changed here.')
  if (viewer.role !== role) {
    const [hasApps] = await db.select({ id: applications.id }).from(applications).where(eq(applications.candidateId, viewer.userId)).limit(1)
    const [hasCompany] = await db.select({ c: companyMembers.companyId }).from(companyMembers).where(eq(companyMembers.userId, viewer.userId)).limit(1)
    if (hasApps || hasCompany) throw new ApiError(409, 'ROLE_LOCKED', 'Your role is locked once you have applications or a company.')
  }
  await db.update(userProfile).set({ role, updatedAt: new Date() }).where(eq(userProfile.userId, viewer.userId))
  return { role }
})
