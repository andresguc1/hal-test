import { eq } from 'drizzle-orm'
import { apiRoute } from '@/lib/api/route'
import { profileSchema } from '@/lib/api/schemas'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/db/schema'

export const PATCH = apiRoute({ name: 'me.profile', auth: 'required', rateLimits: [{ scope: 'user', limit: 20, windowSec: 3600 }] }, async ({ viewer, json }) => {
  const input = await json(profileSchema)
  await db
    .update(userProfile)
    .set({ linkedinUrl: input.linkedinUrl ?? null, portfolioUrl: input.portfolioUrl ?? null, githubUrl: input.githubUrl ?? null, updatedAt: new Date() })
    .where(eq(userProfile.userId, viewer.userId))
  return { ok: true }
})
